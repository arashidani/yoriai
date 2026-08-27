import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    answer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')
  const { MOCK_USERS } = await import('@/lib/mocks/fixtures')

  return {
    authMiddleware: createMiddleware(async (c, next) => {
      c.set('user', MOCK_USERS[0])
      await next()
    }),
  }
})

import app from '@/lib/hono/app'
import { MOCK_ANONYMOUS_PROFILES } from '@/lib/mocks/fixtures'

const restoredAnswer = {
  id: 'answer-test',
  postId: 'post-test',
  authorId: 'user-test',
  body: '回答テスト',
  isHidden: false,
  hiddenAt: null,
  hiddenByUserId: null,
  hiddenReason: null,
  likeCount: 0,
  postAnonymousProfileId: 'assignment-test',
  createdAt: new Date('2026-08-08T01:00:00.000Z'),
  updatedAt: new Date('2026-08-08T02:00:00.000Z'),
  postAnonymousProfile: {
    id: 'assignment-test',
    postId: 'post-test',
    userId: 'user-test',
    anonymousProfileId: MOCK_ANONYMOUS_PROFILES[0].id,
    aliasNumber: 1,
    createdAt: new Date('2026-08-08T00:00:00.000Z'),
    anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
  },
}

describe('管理者回答復元API', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.answer.update.mockResolvedValue(restoredAnswer)
    prismaMock.post.update.mockResolvedValue({ id: 'post-test', answerCount: 1 })
    prismaMock.$transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    )
  })

  it('非表示の回答を復元した場合は質問の回答数を1件増やす', async () => {
    prismaMock.answer.findUnique.mockResolvedValue({
      id: 'answer-test',
      postId: 'post-test',
      isHidden: true,
    })

    const response = await app.request('/api/admin/answers/answer-test/restore', {
      method: 'PATCH',
    })

    expect(response.status).toBe(200)
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: 'post-test' },
      data: { answerCount: { increment: 1 } },
    })
  })

  it('すでに公開済みの回答を復元しても質問の回答数を増やさない', async () => {
    prismaMock.answer.findUnique.mockResolvedValue({
      id: 'answer-test',
      postId: 'post-test',
      isHidden: false,
    })

    const response = await app.request('/api/admin/answers/answer-test/restore', {
      method: 'PATCH',
    })

    expect(response.status).toBe(200)
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock.post.update).not.toHaveBeenCalled()
  })
})
