/** チャットAPI失敗時にUIへ出す既定文言。サーバーの502本文と揃える。 */
export const CHAT_ERROR_FALLBACK = 'AIとの通信に失敗しました'

/** `{ error: string }` 形式のAPI本文から表示文言を取り出す。 */
export function toChatErrorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const message = payload.error
    if (typeof message === 'string' && message.trim()) return message
  }
  return CHAT_ERROR_FALLBACK
}

/**
 * AI SDK は非OKレスポンスの本文を Error.message に入れる。
 * JSON本文がそのまま画面に出ないよう、人間向け文言に戻す。
 */
export function chatErrorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '')
  const trimmed = raw.trim()
  if (!trimmed) return CHAT_ERROR_FALLBACK
  if (!trimmed.startsWith('{')) return trimmed

  try {
    return toChatErrorMessage(JSON.parse(trimmed))
  } catch {
    return CHAT_ERROR_FALLBACK
  }
}
