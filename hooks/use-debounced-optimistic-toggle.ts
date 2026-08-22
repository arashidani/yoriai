import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_DEBOUNCE_MS = 300

function clampCount(value: number): number
function clampCount(value: number | undefined): number | undefined
function clampCount(value: number | undefined) {
  if (value === undefined) return undefined
  return Math.max(0, value)
}

type ParseResult = {
  pressed: boolean
  count?: number
}

type UseDebouncedOptimisticToggleOptions<T> = {
  initialPressed: boolean
  initialCount?: number
  debounceMs?: number
  enabled?: boolean
  onSync: (pressed: boolean) => Promise<T>
  parseResult: (result: T) => ParseResult
  onError?: (error: unknown) => void
}

export function useDebouncedOptimisticToggle<T>({
  initialPressed,
  initialCount,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
  onSync,
  parseResult,
  onError,
}: UseDebouncedOptimisticToggleOptions<T>) {
  const [pressed, setPressed] = useState(initialPressed)
  const [count, setCount] = useState(clampCount(initialCount))

  const confirmedPressedRef = useRef(initialPressed)
  const confirmedCountRef = useRef(clampCount(initialCount))
  const pressedRef = useRef(initialPressed)
  const inFlightRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    confirmedPressedRef.current = initialPressed
    pressedRef.current = initialPressed
    setPressed(initialPressed)
    if (initialCount !== undefined) {
      const nextCount = clampCount(initialCount)
      confirmedCountRef.current = nextCount
      setCount(nextCount)
    }
  }, [initialPressed, initialCount])

  const syncIfNeeded = useCallback(async () => {
    if (!enabled || inFlightRef.current) return

    const target = pressedRef.current
    if (target === confirmedPressedRef.current) return

    inFlightRef.current = true
    try {
      const result = await onSync(target)
      const parsed = parseResult(result)
      confirmedPressedRef.current = parsed.pressed
      pressedRef.current = parsed.pressed
      setPressed(parsed.pressed)
      if (parsed.count !== undefined && initialCount !== undefined) {
        const nextCount = clampCount(parsed.count)
        confirmedCountRef.current = nextCount
        setCount(nextCount)
      }
    } catch (error) {
      pressedRef.current = confirmedPressedRef.current
      setPressed(confirmedPressedRef.current)
      if (initialCount !== undefined) {
        setCount(clampCount(confirmedCountRef.current ?? initialCount))
      }
      onError?.(error)
    } finally {
      inFlightRef.current = false
      if (pressedRef.current !== confirmedPressedRef.current) {
        void syncIfNeeded()
      }
    }
  }, [enabled, onSync, parseResult, onError, initialCount])

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

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    pressed,
    count,
    toggle,
    setPressed: setPressedValue,
  }
}
