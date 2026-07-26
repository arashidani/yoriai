import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    post: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      delete: vi.fn(),
    },
    anonymousProfile: {
      findUnique: vi.fn(),
      delete: vi.fn(),
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

import { Prisma } from '@/app/generated/prisma/client'
import app from '@/lib/hono/app'

function p2025Error() {
  return new Prisma.PrismaClientKnownRequestError('No record was found for a delete.', {
    code: 'P2025',
    clientVersion: '7.9.0',
  })
}

describe('削除APIの同時操作', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('投稿が先に削除された場合も成功扱いにする', async () => {
    prismaMock.post.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.post.delete.mockRejectedValue(p2025Error())

    const response = await app.request('/api/posts/post-1', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('ユーザーが先に削除された場合も成功扱いにする', async () => {
    prismaMock.user.delete.mockRejectedValue(p2025Error())

    const response = await app.request('/api/admin/users/user-2', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('匿名キャラが先に削除された場合も成功扱いにする', async () => {
    prismaMock.anonymousProfile.findUnique.mockResolvedValue({ id: 'profile-1' })
    prismaMock.anonymousProfile.delete.mockRejectedValue(p2025Error())

    const response = await app.request('/api/admin/anonymous-profiles/profile-1', {
      method: 'DELETE',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })
})
