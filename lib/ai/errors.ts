export const GEMINI_REQUEST_TIMEOUT_MS = 30_000

export class GeminiServiceUnavailableError extends Error {
  constructor() {
    super('Gemini service unavailable')
    this.name = 'GeminiServiceUnavailableError'
  }
}

export function isGeminiServiceUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return true
  if (!('status' in error)) return false
  return error.status === 408 || error.status === 503 || error.status === 504
}
