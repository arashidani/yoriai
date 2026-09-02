import { describe, expect, it } from 'vitest'
import {
  filterMentionCandidates,
  mentionQueryBeforeCursor,
  mentionReplacement,
  mentionTokenBeforeCursor,
  mentionTriggerToInsert,
  selectedMentionIdsInBody,
} from '@/lib/mentions/mention-query'

const candidates = [
  { id: 'user-1', displayName: 'ねこ' },
  { id: 'user-2', displayName: 'いぬ' },
]

describe('mentionQueryBeforeCursor', () => {
  it('@ の直後を空クエリとして扱う', () => {
    expect(mentionQueryBeforeCursor('@')).toBe('')
    expect(mentionTokenBeforeCursor('@')).toBe('@')
  })

  it('空白のあとの @名前 をクエリにする', () => {
    expect(mentionQueryBeforeCursor('こんにちは @ね')).toBe('ね')
  })

  it('単語の途中の @ はメンションにしない', () => {
    expect(mentionQueryBeforeCursor('mail@ne')).toBeUndefined()
  })
})

describe('filterMentionCandidates', () => {
  it('表示名の部分一致で最大8件に絞る', () => {
    expect(filterMentionCandidates(candidates, 'ね')).toEqual([candidates[0]])
    expect(filterMentionCandidates(candidates, '')).toEqual(candidates)
  })
})

describe('selectedMentionIdsInBody', () => {
  it('本文から消えたメンションの id を外す', () => {
    expect(selectedMentionIdsInBody(['user-1', 'user-2'], candidates, '@ねこ です')).toEqual([
      'user-1',
    ])
  })

  it('前方一致だけの別ユーザー名は残さない', () => {
    const similarCandidates = [
      { id: 'user-a', displayName: 'ね' },
      { id: 'user-b', displayName: 'ねこ' },
    ]
    expect(selectedMentionIdsInBody(['user-a', 'user-b'], similarCandidates, '@ねこ です')).toEqual([
      'user-b',
    ])
  })
})

describe('mentionTriggerToInsert', () => {
  it('すでに @ クエリ中なら何も挿入しない', () => {
    expect(mentionTriggerToInsert('@ね')).toBe('')
  })

  it('行頭や空白のあとに @ を入れる', () => {
    expect(mentionTriggerToInsert('')).toBe('@')
    expect(mentionTriggerToInsert('こんにちは ')).toBe('@')
    expect(mentionTriggerToInsert('こんにちは')).toBe(' @')
  })
})

describe('mentionReplacement', () => {
  it('確定後に空白を付けて次の入力を分ける', () => {
    expect(mentionReplacement('ねこ')).toBe('@ねこ ')
  })
})
