import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({ prisma: {} }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')

  return {
    authMiddleware: createMiddleware(async (c) => c.json({ error: 'Unauthorized' }, 401)),
  }
})

describe('Q&A API authentication', () => {
  let app: typeof import('@/lib/hono/app').default

  beforeAll(async () => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
    app = (await import('@/lib/hono/app')).default
  })

  it.each([
    '/api/questions',
    '/api/questions/post-1',
    '/api/questions/post-1/answers',
    '/api/question-tags',
    '/api/users/me/questions',
    '/api/users/me/saved-questions',
  ])('requires authentication: GET %s', async (path) => {
    const response = await app.request(path)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })
})
