import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    hiroba: { findUnique: vi.fn() },
    hirobaPost: { findFirst: vi.fn(), create: vi.fn() },
    hirobaAnswer: { create: vi.fn() },
    hirobaMembership: { findUnique: vi.fn() },
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

describe('ひろば投稿・返信の参加制限', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.hirobaMembership.findUnique.mockResolvedValue(null)
  })

  it('未参加のひろばには投稿できない', async () => {
    prismaMock.hiroba.findUnique.mockResolvedValue({ id: 'hiroba-indoor', slug: 'indoor' })

    const response = await app.request('/api/hiroba/indoor/posts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({ title: '未参加の投稿', body: '未参加の投稿の本文' }),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'ひろばに参加してください' })
    expect(prismaMock.hirobaPost.create).not.toHaveBeenCalled()
  })

  it('未参加のひろばの投稿には返信できない', async () => {
    prismaMock.hirobaPost.findFirst.mockResolvedValue({
      id: 'hiroba-post-1',
      hirobaId: 'hiroba-indoor',
      authorId: 'user-2',
      deletedAt: null,
    })

    const response = await app.request('/api/hiroba-posts/hiroba-post-1/answers', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({ body: '未参加の返信' }),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'ひろばに参加してください' })
    expect(prismaMock.hirobaAnswer.create).not.toHaveBeenCalled()
  })
})
