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
      .mockResolvedValueOnce([{ id: 'skill-question' }])
      .mockResolvedValueOnce([{ id: 'other-question' }])
      .mockResolvedValueOnce([
        {
          id: 'other-question',
          title: 'その他の質問',
          postAnonymousProfile: {
            aliasNumber: 2,
            anonymousProfile: { displayName: 'いぬ', avatarUrls: ['dog-1.webp', 'dog-2.webp'] },
          },
        },
        {
          id: 'skill-question',
          title: '営業の質問',
          postAnonymousProfile: {
            aliasNumber: 1,
            anonymousProfile: { displayName: 'ねこ', avatarUrls: ['cat.webp'] },
          },
        },
      ])
  })

  it('候補はidだけで取得し、選出後に匿名プロフィールを取得して優先順で返す', async () => {
    const response = await app.request('/api/questions/answerable')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      questions: [
        {
          id: 'skill-question',
          title: '営業の質問',
          displayAuthor: { displayName: 'ねこ', avatarUrl: 'cat.webp' },
        },
        {
          id: 'other-question',
          title: 'その他の質問',
          displayAuthor: { displayName: 'いぬ#2', avatarUrl: 'dog-2.webp' },
        },
      ],
    })
    expect(prismaMock.post.findMany).toHaveBeenCalledTimes(3)
    for (const [query] of prismaMock.post.findMany.mock.calls.slice(0, 2)) {
      expect(query).toMatchObject({ select: { id: true } })
      expect(query).not.toHaveProperty('include')
    }
    expect(prismaMock.post.findMany.mock.calls[2]?.[0]).toMatchObject({
      where: { id: { in: ['skill-question', 'other-question'] } },
      select: {
        id: true,
        title: true,
        postAnonymousProfile: { include: { anonymousProfile: true } },
      },
    })
  })
})
