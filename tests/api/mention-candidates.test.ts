import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({ prisma: {} }))

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
  afterEach(() => vi.unstubAllEnvs())

  it('Q&Aではスレッド内の匿名エイリアスを返す', async () => {
    vi.stubEnv('MOCK_MODE', 'true')

    const response = await app.request('/api/questions/post-1/mention-candidates')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ candidates: [{ id: 'user-2', displayName: 'ねこ' }] })
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
})
