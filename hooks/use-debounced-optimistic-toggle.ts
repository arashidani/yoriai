import { useCallback, useEffect, useRef, useState } from 'react'

/** 連打時の API 呼び出しをまとめるデフォルトの待機時間（ミリ秒） */
const DEFAULT_DEBOUNCE_MS = 300

/** カウントが負数にならないよう 0 以上に丸める */
function clampCount(value: number): number
function clampCount(value: number | undefined): number | undefined
function clampCount(value: number | undefined) {
  if (value === undefined) return undefined
  return Math.max(0, value)
}

/** onSync のレスポンスから UI に反映する状態 */
type ParseResult = {
  pressed: boolean
  count?: number
}

type UseDebouncedOptimisticToggleOptions<T> = {
  /** サーバー確定済みの初期 ON/OFF 状態 */
  initialPressed: boolean
  /** いいね数など。未指定ならカウントの楽観更新は行わない */
  initialCount?: number
  /** 同一対象の楽観的な props 更新を初期値として取り込まないための識別子 */
  resetKey?: string
  /** トグル後、API を叩くまでのデバウンス時間（ミリ秒） */
  debounceMs?: number
  /** false のときは UI 更新のみで API 同期しない（未ログイン時など） */
  enabled?: boolean
  /** 確定状態をサーバーへ送る。引数は pressedRef の現在値 */
  onSync: (pressed: boolean) => Promise<T>
  /** API レスポンスを pressed / count に変換する */
  parseResult: (result: T) => ParseResult
  onError?: (error: unknown) => void
}

/**
 * デバウンス付き楽観的トグルフック。
 *
 * ユーザー操作ですぐ UI を更新し、デバウンス後に API と同期する。
 * 連打や in-flight 中の再トグルにも対応する。
 *
 * 状態の役割:
 * - `pressed` / `count` … React state（画面表示用）
 * - `pressedRef` … ユーザーの最新意図（楽観更新のSingle Source of Truth）
 * - `confirmedPressedRef` / `confirmedCountRef` … サーバーと一致している確定値
 */
export function useDebouncedOptimisticToggle<T>({
  initialPressed,
  initialCount,
  resetKey,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
  onSync,
  parseResult,
  onError,
}: UseDebouncedOptimisticToggleOptions<T>) {
  const [pressed, setPressed] = useState(initialPressed)
  const [count, setCount] = useState(clampCount(initialCount))

  // サーバー確定済みの状態（エラー時のロールバック先）
  const confirmedPressedRef = useRef(initialPressed)
  const confirmedCountRef = useRef(clampCount(initialCount))
  // ユーザーの最新トグル意図（楽観 UI の基準）
  const pressedRef = useRef(initialPressed)
  // 同一フック内で onSync が並行実行されないよう排他する
  const inFlightRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetKeyRef = useRef(resetKey)

  // resetKey 指定時は別対象への遷移だけをサーバー確定値として取り込む。
  // 同一対象の楽観キャッシュ更新を取り込むと、未送信の操作を確定済みと誤認してしまう。
  useEffect(() => {
    if (resetKey !== undefined && resetKeyRef.current === resetKey) return

    resetKeyRef.current = resetKey
    confirmedPressedRef.current = initialPressed
    pressedRef.current = initialPressed
    setPressed(initialPressed)
    if (initialCount !== undefined) {
      const nextCount = clampCount(initialCount)
      confirmedCountRef.current = nextCount
      setCount(nextCount)
    }
  }, [initialPressed, initialCount, resetKey])

  /** pressedRef と confirmedPressedRef が食い違っていれば API 同期する */
  const syncIfNeeded = useCallback(async () => {
    if (!enabled || inFlightRef.current) return

    const target = pressedRef.current
    // 既にサーバーと一致していれば何もしない
    if (target === confirmedPressedRef.current) return

    inFlightRef.current = true
    try {
      const result = await onSync(target)
      const parsed = parseResult(result)
      confirmedPressedRef.current = parsed.pressed
      if (parsed.count !== undefined && initialCount !== undefined) {
        confirmedCountRef.current = clampCount(parsed.count)
      }
      // リクエスト中にユーザーが再トグルしていたら、楽観 UI を維持する
      // （最新の pressedRef が送信時点の target と一致する場合のみサーバー値で上書き）
      if (pressedRef.current === target) {
        pressedRef.current = parsed.pressed
        setPressed(parsed.pressed)
        if (parsed.count !== undefined && initialCount !== undefined) {
          setCount(clampCount(parsed.count))
        }
      }
    } catch (error) {
      // 失敗時は最後に確定していたサーバー状態へロールバック
      pressedRef.current = confirmedPressedRef.current
      setPressed(confirmedPressedRef.current)
      if (initialCount !== undefined) {
        setCount(clampCount(confirmedCountRef.current ?? initialCount))
      }
      onError?.(error)
    } finally {
      inFlightRef.current = false
      // 同期中にさらにトグルされていたら、残りの差分を追いかける
      if (pressedRef.current !== confirmedPressedRef.current) {
        void syncIfNeeded()
      }
    }
  }, [enabled, onSync, parseResult, onError, initialCount])

  /** デバウンスタイマーをリセットし、一定時間後に syncIfNeeded を予約する */
  const scheduleSync = useCallback(() => {
    if (!enabled) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      void syncIfNeeded()
    }, debounceMs)
  }, [debounceMs, enabled, syncIfNeeded])

  const setPressedValue = useCallback(
    (next: boolean) => {
      if (next === pressedRef.current) return

      const delta = next ? 1 : -1
      pressedRef.current = next
      setPressed(next)
      // カウント表示がある場合のみ、楽観的に ±1 する
      if (initialCount !== undefined) {
        setCount((current) => clampCount((current ?? 0) + delta))
      }
      scheduleSync()
    },
    [initialCount, scheduleSync],
  )

  const toggle = useCallback(() => {
    setPressedValue(!pressedRef.current)
  }, [setPressedValue])

  // アンマウント時のクリーンアップで最新の syncIfNeeded を参照するため ref に保持
  const syncIfNeededRef = useRef(syncIfNeeded)
  syncIfNeededRef.current = syncIfNeeded

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      // アンマウント直前に未送信のトグルがあれば最後に同期を試みる
      void syncIfNeededRef.current()
    }
  }, [])

  return {
    pressed,
    count,
    toggle,
    setPressed: setPressedValue,
  }
}
