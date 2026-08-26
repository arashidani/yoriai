import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assignTagsWithStatus, selectValidTagNames, type TagCandidate } from '@/lib/ai/assign-tags'

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

const candidates: TagCandidate[] = [
  { name: '給与', category: '人事', description: '給与計算に関する質問' },
  { name: '採用', category: '人事', description: '採用活動に関する質問' },
  { name: '請求書', category: '経理', description: null },
  { name: '雑談', category: '交流', description: null },
  { name: '福利厚生', category: '制度', description: null },
]

beforeEach(() => {
  generateContentMock.mockReset()
  googleGenAiConstructorMock.mockReset()
  vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('selectValidTagNames', () => {
  it('登録済みタグから最大1件だけ選ぶ', () => {
    expect(selectValidTagNames(['給与', '採用', '請求書', '雑談', '福利厚生'], candidates)).toEqual(
      ['給与'],
    )
  })

  it('未知のタグ、重複、文字列以外の値を捨てる', () => {
    expect(selectValidTagNames(['不存在', '給与', '給与', 123, '請求書'], candidates)).toEqual([
      '給与',
    ])
  })

  it('配列でないAI出力を安全に空配列へ倒す', () => {
    expect(selectValidTagNames(null, candidates)).toEqual([])
  })
})

describe('assignTagsWithStatus', () => {
  it('Geminiには分類に必要な候補タグの3項目だけを渡す', async () => {
    generateContentMock.mockResolvedValue({ text: JSON.stringify({ tagNames: ['給与'] }) })
    const candidatesWithDatabaseFields = [
      {
        id: 'tag-1',
        name: '給与',
        category: '人事',
        categoryDefinition: {
          id: 'category-1',
          name: '人事',
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        },
        description: '給与計算や支給日の質問',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        id: 'tag-2',
        name: 'その他（雑談に近い質問）',
        category: 'その他',
        categoryDefinition: null,
        description: null,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
      },
    ]

    await expect(
      assignTagsWithStatus(
        '給与の支給日',
        '今月の給与の支給日を教えてください',
        candidatesWithDatabaseFields,
      ),
    ).resolves.toEqual({ status: 'assigned', tagNames: ['給与'] })

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents:
          '候補タグ: [{"name":"給与","category":"人事","description":"給与計算や支給日の質問"},{"name":"その他（雑談に近い質問）","category":"その他","description":null}]\nタイトル: 給与の支給日\n本文: 今月の給与の支給日を教えてください',
      }),
    )
    expect(googleGenAiConstructorMock).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      httpOptions: { timeout: 30_000, retryOptions: { attempts: 1 } },
    })
  })

  it('Gemini SDKが応答しなくても30秒でタグ付与を失敗扱いにする', async () => {
    vi.useFakeTimers()
    generateContentMock.mockImplementation(() => new Promise(() => {}))

    const assignment = assignTagsWithStatus('質問', '本文', candidates)
    await vi.advanceTimersByTimeAsync(30_000)

    await expect(Promise.race([assignment, Promise.resolve('still-pending')])).resolves.toEqual({
      status: 'failed',
      tagNames: [],
    })
  })
})
