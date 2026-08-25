import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    post: { findFirst: vi.fn() },
    hirobaPost: { findFirst: vi.fn() },
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

describe('メンション候補API', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it('Q&Aではスレッド内の匿名エイリアスを返す', async () => {
    vi.stubEnv('MOCK_MODE', 'true')

    const response = await app.request('/api/questions/post-1/mention-candidates')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      candidates: [{ id: 'mock-assignment-answer-1', displayName: 'ねこ' }],
    })
  })

  it('Q&Aでは実ユーザーIDを返さず、削除・非表示を除外する', async () => {
    vi.stubEnv('MOCK_MODE', 'false')
    prismaMock.post.findFirst.mockResolvedValue({
      authorId: 'real-user-id',
      postAnonymousProfile: {
        id: 'opaque-assignment-id',
        aliasNumber: 1,
        anonymousProfile: { displayName: 'ねこ' },
      },
      answers: [],
    })

    const response = await app.request('/api/questions/post-1/mention-candidates')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      candidates: [{ id: 'opaque-assignment-id', displayName: 'ねこ' }],
    })
    expect(prismaMock.post.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1', deletedAt: null, status: { not: 'HIDDEN' } },
      }),
    )
  })

  it('ひろばでは最新の回答者から候補を返す', async () => {
    vi.stubEnv('MOCK_MODE', 'true')

    const response = await app.request('/api/hiroba-posts/hiroba-post-1/mention-candidates')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      candidates: [
        { id: 'user-1', displayName: '開発者' },
        { id: 'user-2', displayName: '一般ユーザー' },
      ],
    })
  })

  it('ひろばでは名前未設定でもメールアドレスを返さない', async () => {
    vi.stubEnv('MOCK_MODE', 'false')
    prismaMock.hirobaPost.findFirst.mockResolvedValue({
      authorId: 'user-with-email-only',
      author: { name: null, username: null },
      answers: [],
    })

    const response = await app.request('/api/hiroba-posts/hiroba-post-1/mention-candidates')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      candidates: [{ id: 'user-with-email-only', displayName: 'ユーザー' }],
    })
  })
})
