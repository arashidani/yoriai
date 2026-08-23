import { describe, expect, it } from 'vitest'
import type { QuestionStatus } from '@/app/generated/prisma/enums'
import { getMostLikedAnswerId, toQuestionResponse } from '@/lib/questions/api-mappers'

const answer = (id: string, likeCount: number, createdAt: string) => ({
  id,
  likeCount,
  createdAt: new Date(createdAt),
})

describe('getMostLikedAnswerId', () => {
  it('does not select a medal answer before the question is resolved', () => {
    expect(
      getMostLikedAnswerId('OPEN' as QuestionStatus, [
        answer('answer-1', 3, '2026-08-01T00:00:00.000Z'),
      ]),
    ).toBeNull()
  })

  it('does not select a medal answer when every answer has zero likes', () => {
    expect(
      getMostLikedAnswerId('RESOLVED' as QuestionStatus, [
        answer('answer-1', 0, '2026-08-01T00:00:00.000Z'),
        answer('answer-2', 0, '2026-08-02T00:00:00.000Z'),
      ]),
    ).toBeNull()
  })

  it('selects the oldest answer when the highest like count is tied', () => {
    expect(
      getMostLikedAnswerId('RESOLVED' as QuestionStatus, [
        answer('answer-new', 5, '2026-08-02T00:00:00.000Z'),
        answer('answer-old', 5, '2026-08-01T00:00:00.000Z'),
        answer('answer-low', 2, '2026-07-01T00:00:00.000Z'),
      ]),
    ).toBe('answer-old')
  })
})

describe('toQuestionResponse', () => {
  it('小ジャンルではなく親カテゴリーを表示用タグとして返す', () => {
    const response = toQuestionResponse(
      {
        id: 'post-1',
        title: '質問',
        body: '本文',
        authorId: 'user-2',
        author: { name: '投稿者' },
        status: 'OPEN',
        tags: [
          {
            id: 'post-tag-1',
            createdAt: new Date('2026-08-01'),
            tag: {
              id: 'tag-1',
              name: 'Next.js',
              category: 'フレームワーク',
              categoryDefinition: { id: 'tag-category-1', name: 'フレームワーク' },
            },
          },
        ],
        likes: [],
        bookmarks: [],
        createdAt: new Date('2026-08-01'),
        updatedAt: new Date('2026-08-01'),
      },
      'user-1',
    )

    expect(response.tag).toEqual({ id: 'tag-category-1', name: 'フレームワーク' })
  })
})
