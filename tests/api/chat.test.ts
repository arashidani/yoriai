import { beforeAll, describe, expect, it, vi } from 'vitest'

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

const validBody = {
  messages: [{ role: 'user', parts: [{ type: 'text', text: 'こんにちは' }] }],
}

describe('チャットAPI', () => {
  let app: typeof import('@/lib/hono/app').default

  beforeAll(async () => {
    vi.stubEnv('MOCK_MODE', 'true')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
    app = (await import('@/lib/hono/app')).default
  })

  it('不正なリクエストボディは400を返す', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: 'not-an-array' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: expect.any(String) })
  })

  it('空のメッセージ配列は400を返す', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'メッセージが空です' })
  })

  it('テキストが空のメッセージは400を返す', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: '   ' }] }],
      }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'メッセージが空です' })
  })

  it('有効なリクエストはストリームを返す', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
  })
})
