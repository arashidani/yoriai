import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    post: { findUnique: vi.fn(), update: vi.fn() },
    questionLike: { createMany: vi.fn(), count: vi.fn() },
    hirobaPost: { findFirst: vi.fn(), update: vi.fn() },
    hirobaAnswer: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    hirobaPostLike: { createMany: vi.fn(), count: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')
  return {
    authMiddleware: createMiddleware(async (c, next) => {
      c.set('user', MOCK_USERS[0])
      await next()
    }),
  }
})

vi.mock('@/lib/ai/moderate-post', () => ({
  moderateAnswer: vi.fn().mockResolvedValue(null),
  moderatePost: vi.fn().mockResolvedValue(null),
}))

import app from '@/lib/hono/app'

describe('返信・リアクション通知', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    )
  })

  it('質問への新規いいねで質問者に通知する', async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-2',
      deletedAt: null,
    })
    prismaMock.questionLike.createMany.mockResolvedValue({ count: 1 })
    prismaMock.questionLike.count.mockResolvedValue(1)

    const response = await app.request('/api/questions/post-1/likes', { method: 'POST' })

    expect(response.status).toBe(200)
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: { userId: 'user-2', type: 'POST_LIKED', postId: 'post-1' },
    })
  })

  it('すでに付けたいいねでは通知を増やさない', async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-2',
      deletedAt: null,
    })
    prismaMock.questionLike.createMany.mockResolvedValue({ count: 0 })
    prismaMock.questionLike.count.mockResolvedValue(1)

    const response = await app.request('/api/questions/post-1/likes', { method: 'POST' })

    expect(response.status).toBe(200)
    expect(prismaMock.notification.create).not.toHaveBeenCalled()
  })

  it('ひろば投稿への返信で投稿者に通知する', async () => {
    prismaMock.hirobaPost.findFirst.mockResolvedValue({
      id: 'hiroba-post-1',
      authorId: 'user-2',
      deletedAt: null,
    })
    prismaMock.hirobaAnswer.create.mockResolvedValue({
      id: 'hiroba-answer-new',
      hirobaPostId: 'hiroba-post-1',
      authorId: 'user-1',
      author: MOCK_USERS[0],
      body: '返信です',
      isHidden: false,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.request('/api/hiroba-posts/hiroba-post-1/answers', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({ body: '返信です' }),
    })

    expect(response.status).toBe(201)
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        type: 'HIROBA_POST_ANSWERED',
        hirobaPostId: 'hiroba-post-1',
        hirobaAnswerId: 'hiroba-answer-new',
      },
    })
  })
})
