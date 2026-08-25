import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GeminiServiceUnavailableError } from '@/lib/ai/errors'
import { moderatePost } from '@/lib/ai/moderate-post'

const { generateContentMock, googleGenAiConstructorMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
  googleGenAiConstructorMock: vi.fn(),
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock }

    constructor(options: unknown) {
      googleGenAiConstructorMock(options)
    }
  },
}))

beforeEach(() => {
  generateContentMock.mockReset()
  googleGenAiConstructorMock.mockReset()
  vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
})

describe('moderatePost', () => {
  it('Gemini呼び出しを30秒でタイムアウトする', async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({ flagged: false, severity: 'LOW', reason: '' }),
    })

    await moderatePost('質問', '本文')

    expect(googleGenAiConstructorMock).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      httpOptions: { timeout: 30_000 },
    })
  })

  it('Geminiが503を返した場合はサービス利用不可エラーを送出する', async () => {
    generateContentMock.mockRejectedValue(
      Object.assign(new Error('This model is currently experiencing high demand.'), {
        status: 503,
      }),
    )

    await expect(moderatePost('質問', '本文')).rejects.toBeInstanceOf(GeminiServiceUnavailableError)
  })

  it('Gemini呼び出しがタイムアウトした場合もサービス利用不可エラーを送出する', async () => {
    const timeoutError = new Error('Request timed out')
    timeoutError.name = 'TimeoutError'
    generateContentMock.mockRejectedValue(timeoutError)

    await expect(moderatePost('質問', '本文')).rejects.toBeInstanceOf(GeminiServiceUnavailableError)
  })

  it('503以外のGeminiエラーは従来どおり判定なしへ倒す', async () => {
    generateContentMock.mockRejectedValue(
      Object.assign(new Error('Too many requests'), { status: 429 }),
    )

    await expect(moderatePost('質問', '本文')).resolves.toBeNull()
  })
})
