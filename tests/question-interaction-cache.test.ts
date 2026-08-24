import { describe, expect, it } from 'vitest'
import { getQueryClient } from '@/lib/query-client'
import {
  getQuestionInteractionFromCache,
  patchQuestionInteractionCache,
  questionInteractionKey,
} from '@/lib/questions/question-interaction-cache'

const LIST_QUERY_KEY = ['questions', { page: 1, status: 'all', keyword: '', tagId: undefined }]

describe('question-interaction-cache', () => {
  it('prefers dedicated interaction cache over list cache', () => {
    const queryClient = getQueryClient()
    queryClient.setQueryData(LIST_QUERY_KEY, {
      posts: [{ id: 'post-1', saved: false, bookmarkCount: 0, liked: false, likeCount: 0 }],
      totalPages: 1,
      total: 1,
    })
    patchQuestionInteractionCache(queryClient, 'post-1', { saved: true, bookmarkCount: 3 })

    expect(getQuestionInteractionFromCache(queryClient, 'post-1')).toEqual({
      saved: true,
      bookmarkCount: 3,
    })
  })

  it('merges dedicated interaction cache patches', () => {
    const queryClient = getQueryClient()
    patchQuestionInteractionCache(queryClient, 'post-1', { saved: true })
    patchQuestionInteractionCache(queryClient, 'post-1', { bookmarkCount: 2, liked: true })

    expect(getQuestionInteractionFromCache(queryClient, 'post-1')).toEqual({
      saved: true,
      bookmarkCount: 2,
      liked: true,
    })
  })

  it('falls back to questions list cache when dedicated cache is empty', () => {
    const queryClient = getQueryClient()
    queryClient.setQueryData(LIST_QUERY_KEY, {
      posts: [{ id: 'post-1', saved: true, bookmarkCount: 2, liked: true, likeCount: 5 }],
      totalPages: 1,
      total: 1,
    })

    expect(getQuestionInteractionFromCache(queryClient, 'post-1')).toEqual({
      saved: true,
      bookmarkCount: 2,
      liked: true,
      likeCount: 5,
    })
    expect(queryClient.getQueryData(questionInteractionKey('post-1'))).toBeUndefined()
  })
})
