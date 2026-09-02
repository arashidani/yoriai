import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({ prisma: {} }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')

  return {
    authMiddleware: createMiddleware(async (c) => c.json({ error: 'Unauthorized' }, 401)),
  }
})

describe('ひろばAPIの認証', () => {
  let app: typeof import('@/lib/hono/app').default

  beforeAll(async () => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
    app = (await import('@/lib/hono/app')).default
  })

  it.each([
    '/api/hiroba',
    '/api/hiroba/alcohol',
    '/api/hiroba-posts/hiroba-post-1',
    '/api/hiroba-posts/hiroba-post-1/answers',
  ])('未認証では取得できない: GET %s', async (path) => {
    const response = await app.request(path)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })
})
