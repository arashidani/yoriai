export const GEMINI_REQUEST_TIMEOUT_MS = 30_000

/** SDKの応答状態にかかわらず、Gemini処理全体を30秒で打ち切る。 */
export async function withGeminiRequestTimeout<T>(
  operation: (abortSignal: AbortSignal) => Promise<T>,
): Promise<T> {
  const abortController = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      abortController.abort()
      const error = new Error('Gemini request timed out')
      error.name = 'TimeoutError'
      reject(error)
    }, GEMINI_REQUEST_TIMEOUT_MS)
  })

  try {
    return await Promise.race([operation(abortController.signal), timeout])
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}
