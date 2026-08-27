import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assignTagsWithStatus,
  selectValidTagNames,
  type TagCandidate,
  toTagAssignmentErrorStatus,
} from '@/lib/ai/assign-tags'

const generateContentMock = vi.hoisted(() => vi.fn())

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock }
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
  vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
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
        model: 'gemini-3.5-flash',
        contents:
          '候補タグ: [{"name":"給与","category":"人事","description":"給与計算や支給日の質問"},{"name":"その他（雑談に近い質問）","category":"その他","description":null}]\nタイトル: 給与の支給日\n本文: 今月の給与の支給日を教えてください',
      }),
    )
  })

  it('Geminiが429を返したらhttpStatusに保持する', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    generateContentMock.mockRejectedValue(Object.assign(new Error('quota'), { status: 429 }))

    await expect(
      assignTagsWithStatus('給与の支給日', '支給日を教えてください', candidates),
    ).resolves.toEqual({
      status: 'failed',
      tagNames: [],
      httpStatus: 429,
    })
    consoleError.mockRestore()
  })

  it('空テキストや未知のタグ名はhttpStatusなしの失敗にする', async () => {
    generateContentMock.mockResolvedValue({ text: '' })
    await expect(
      assignTagsWithStatus('給与の支給日', '支給日を教えてください', candidates),
    ).resolves.toEqual({
      status: 'failed',
      tagNames: [],
      httpStatus: null,
    })

    generateContentMock.mockResolvedValue({ text: JSON.stringify({ tagNames: ['未知'] }) })
    await expect(
      assignTagsWithStatus('給与の支給日', '支給日を教えてください', candidates),
    ).resolves.toEqual({
      status: 'failed',
      tagNames: [],
      httpStatus: null,
    })
  })
})

describe('toTagAssignmentErrorStatus', () => {
  it('GeminiのHTTPステータスをクライアントへ写す', () => {
    expect(toTagAssignmentErrorStatus({ status: 'failed', tagNames: [], httpStatus: 429 })).toBe(
      429,
    )
    expect(toTagAssignmentErrorStatus({ status: 'failed', tagNames: [], httpStatus: 503 })).toBe(
      503,
    )
    expect(toTagAssignmentErrorStatus({ status: 'failed', tagNames: [], httpStatus: 504 })).toBe(
      504,
    )
    expect(toTagAssignmentErrorStatus({ status: 'failed', tagNames: [], httpStatus: 500 })).toBe(
      502,
    )
  })

  it('有効なタグを選べない失敗と候補なしは422にする', () => {
    expect(toTagAssignmentErrorStatus({ status: 'failed', tagNames: [], httpStatus: null })).toBe(
      422,
    )
    expect(toTagAssignmentErrorStatus({ status: 'skipped', tagNames: [] })).toBe(422)
  })
})
