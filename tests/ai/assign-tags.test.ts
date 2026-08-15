import { describe, expect, it } from 'vitest'
import { selectValidTagNames, type TagCandidate } from '@/lib/ai/assign-tags'

const candidates: TagCandidate[] = [
  { name: '給与', category: '人事', description: '給与計算に関する質問' },
  { name: '採用', category: '人事', description: '採用活動に関する質問' },
  { name: '請求書', category: '経理', description: null },
  { name: '雑談', category: '交流', description: null },
  { name: '福利厚生', category: '制度', description: null },
]

describe('selectValidTagNames', () => {
  it('登録済みタグをカテゴリーごとに最大1件、全体で最大3件選ぶ', () => {
    expect(selectValidTagNames(['給与', '採用', '請求書', '雑談', '福利厚生'], candidates)).toEqual(
      ['給与', '請求書', '雑談'],
    )
  })

  it('未知のタグ、重複、文字列以外の値を捨てる', () => {
    expect(selectValidTagNames(['不存在', '給与', '給与', 123, '請求書'], candidates)).toEqual([
      '給与',
      '請求書',
    ])
  })

  it('配列でないAI出力を安全に空配列へ倒す', () => {
    expect(selectValidTagNames(null, candidates)).toEqual([])
  })
})
