import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    post: {
      findUnique: vi.fn(),
    },
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

const requestInit = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
  },
  body: JSON.stringify({ body: '回答テスト' }),
} as const

describe('削除済み投稿への回答投稿', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('削除済み投稿には日本語のエラーを返す', async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: 'post-1',
      deletedAt: new Date('2026-08-03T00:00:00.000Z'),
    })

    const response = await app.request('/api/questions/post-1/answers', requestInit)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'この投稿は削除されたため、回答できません',
    })
  })

  it('存在しない投稿には日本語のエラーを返す', async () => {
    prismaMock.post.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/questions/post-1/answers', requestInit)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: '投稿が見つかりません' })
  })
})
