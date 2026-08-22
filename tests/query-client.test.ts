import { describe, expect, it } from 'vitest'
import { getQueryClient } from '@/lib/query-client'

const QUERY_KEY = ['questions', { page: 1, status: 'all', keyword: '', tagId: undefined }]

describe('getQueryClient', () => {
  it('does not reuse query cache across server requests', () => {
    const previousRequest = getQueryClient()
    previousRequest.setQueryData(QUERY_KEY, {
      posts: [{ id: 'post-1', saved: false, bookmarkCount: 0 }],
    })

    const nextRequest = getQueryClient()

    expect(nextRequest).not.toBe(previousRequest)
    expect(nextRequest.getQueryData(QUERY_KEY)).toBeUndefined()
  })
})
