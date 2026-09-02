import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    hiroba: { findUnique: vi.fn() },
    hirobaMembership: { upsert: vi.fn() },
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

describe('ひろば参加API', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.hiroba.findUnique.mockResolvedValue({ id: 'hiroba-alcohol' })
  })

  it('ユーザーをひろばに参加させる', async () => {
    const response = await app.request('/api/hiroba/alcohol/membership', { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ joined: true })
    expect(prismaMock.hirobaMembership.upsert).toHaveBeenCalledWith({
      where: { userId_hirobaId: { userId: 'user-1', hirobaId: 'hiroba-alcohol' } },
      update: {},
      create: { userId: 'user-1', hirobaId: 'hiroba-alcohol' },
    })
  })

  it('ひろばからは退出できない', async () => {
    const response = await app.request('/api/hiroba/alcohol/membership', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ joined: true })
  })

  it('自分と異なるMBTIグループには参加できない', async () => {
    const response = await app.request('/api/hiroba/mbti-purple/membership', { method: 'POST' })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: '自分のグループの広場にのみ参加できます',
    })
    expect(prismaMock.hirobaMembership.upsert).not.toHaveBeenCalled()
  })

  it('固定カタログにないslugは参加させない', async () => {
    const response = await app.request('/api/hiroba/unknown/membership', { method: 'POST' })

    expect(response.status).toBe(404)
    expect(prismaMock.hirobaMembership.upsert).not.toHaveBeenCalled()
  })
})
