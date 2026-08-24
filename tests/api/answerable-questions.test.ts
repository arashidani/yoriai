import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    userBusinessSkill: { findMany: vi.fn() },
    post: { findMany: vi.fn() },
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

import app from '@/lib/hono/app'

describe('GET /api/questions/answerable', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.userBusinessSkill.findMany.mockResolvedValue([{ businessSkill: { name: '営業' } }])
    prismaMock.post.findMany
      .mockResolvedValueOnce([{ id: 'skill-question', title: '営業の質問' }])
      .mockResolvedValueOnce([{ id: 'other-question', title: 'その他の質問' }])
  })

  it('表示に必要なidとtitleだけをDBから取得して返す', async () => {
    const response = await app.request('/api/questions/answerable')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      questions: expect.arrayContaining([
        { id: 'skill-question', title: '営業の質問' },
        { id: 'other-question', title: 'その他の質問' },
      ]),
    })
    expect(prismaMock.post.findMany).toHaveBeenCalledTimes(2)
    for (const [query] of prismaMock.post.findMany.mock.calls) {
      expect(query).toMatchObject({ select: { id: true, title: true } })
      expect(query).not.toHaveProperty('include')
    }
  })
})
