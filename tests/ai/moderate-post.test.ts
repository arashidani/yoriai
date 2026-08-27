import { beforeEach, describe, expect, it, vi } from 'vitest'
import { moderatePost } from '@/lib/ai/moderate-post'

const generateContentMock = vi.hoisted(() => vi.fn())

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock }
  },
}))

beforeEach(() => {
  generateContentMock.mockReset()
  vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
})

describe('moderatePost', () => {
  it('固定Stableモデルで投稿を判定する', async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({ flagged: false, severity: 'LOW', reason: '' }),
    })

    await expect(moderatePost('質問タイトル', '質問本文')).resolves.toEqual({
      flagged: false,
      severity: 'LOW',
      reason: '',
    })

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.5-flash',
        contents: 'タイトル: 質問タイトル\n本文: 質問本文',
        config: expect.objectContaining({
          systemInstruction: expect.stringMatching(/下品な表現.*公共の場で使うべきでない表現/),
        }),
      }),
    )
  })
})
