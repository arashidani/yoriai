import { beforeEach, describe, expect, it, vi } from 'vitest'
import { moderateAnswer, moderatePost } from '@/lib/ai/moderate-post'

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
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          systemInstruction: expect.stringMatching(/下品|下ネタ|不謹慎/),
        }),
      }),
    )
  })

  it('Geminiが503を返した場合はモデレーションをスキップする', async () => {
    generateContentMock.mockRejectedValue(
      Object.assign(new Error('This model is currently experiencing high demand.'), {
        status: 503,
      }),
    )

    await expect(moderatePost('質問', '本文')).resolves.toBeNull()
  })

  it('Gemini呼び出しがタイムアウトした場合もモデレーションをスキップする', async () => {
    const timeoutError = new Error('Request timed out')
    timeoutError.name = 'TimeoutError'
    generateContentMock.mockRejectedValue(timeoutError)

    await expect(moderatePost('質問', '本文')).resolves.toBeNull()
  })

  it('503以外のGeminiエラーは従来どおり判定なしへ倒す', async () => {
    generateContentMock.mockRejectedValue(
      Object.assign(new Error('Too many requests'), { status: 429 }),
    )

    await expect(moderatePost('質問', '本文')).resolves.toBeNull()
  })

  it('回答でも503の場合はモデレーションをスキップする', async () => {
    generateContentMock.mockRejectedValue(
      Object.assign(new Error('Service unavailable'), { status: 503 }),
    )

    await expect(moderateAnswer('回答')).resolves.toBeNull()
  })
})
