import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { authState, prismaMock } = vi.hoisted(() => ({
  authState: { userIndex: 0 as number | null },
  prismaMock: {
    hirobaPost: {
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
      if (authState.userIndex === null) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      c.set('user', MOCK_USERS[authState.userIndex])
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

/** MOCK_USERS[0] は管理者、MOCK_USERS[1]（user-2）は一般ユーザー。 */
function hirobaPost(overrides: { authorId?: string; answerCount?: number } = {}) {
  return {
    id: 'hiroba-post-1',
    authorId: 'user-2',
    answerCount: 0,
    ...overrides,
  }
}

describe('ひろば投稿削除API', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    authState.userIndex = 0
  })

  it('管理者は回答が付いている他人の投稿でも削除できる', async () => {
    prismaMock.hirobaPost.findUnique.mockResolvedValue(hirobaPost({ answerCount: 3 }))
    prismaMock.hirobaPost.delete.mockResolvedValue({ id: 'hiroba-post-1' })

    const response = await app.request('/api/hiroba-posts/hiroba-post-1', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(prismaMock.hirobaPost.delete).toHaveBeenCalledWith({
      where: { id: 'hiroba-post-1' },
    })
  })

  it('投稿者本人は回答が付く前なら削除できる', async () => {
    authState.userIndex = 1
    prismaMock.hirobaPost.findUnique.mockResolvedValue(hirobaPost())
    prismaMock.hirobaPost.delete.mockResolvedValue({ id: 'hiroba-post-1' })

    const response = await app.request('/api/hiroba-posts/hiroba-post-1', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('回答が付いている投稿は投稿者本人には削除できない', async () => {
    authState.userIndex = 1
    prismaMock.hirobaPost.findUnique.mockResolvedValue(hirobaPost({ answerCount: 1 }))

    const response = await app.request('/api/hiroba-posts/hiroba-post-1', { method: 'DELETE' })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: '回答がある投稿は削除できません' })
    expect(prismaMock.hirobaPost.delete).not.toHaveBeenCalled()
  })

  it('管理者でも投稿者本人でもないユーザーの削除を拒否する', async () => {
    authState.userIndex = 1
    prismaMock.hirobaPost.findUnique.mockResolvedValue(hirobaPost({ authorId: 'user-3' }))

    const response = await app.request('/api/hiroba-posts/hiroba-post-1', { method: 'DELETE' })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(prismaMock.hirobaPost.delete).not.toHaveBeenCalled()
  })

  it('対象が存在しない場合も成功扱いにする', async () => {
    prismaMock.hirobaPost.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/hiroba-posts/missing-post', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(prismaMock.hirobaPost.delete).not.toHaveBeenCalled()
  })

  it('削除直前に消えていた場合も成功扱いにする', async () => {
    prismaMock.hirobaPost.findUnique.mockResolvedValue(hirobaPost())
    prismaMock.hirobaPost.delete.mockRejectedValue(p2025Error())

    const response = await app.request('/api/hiroba-posts/hiroba-post-1', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('未認証ユーザーによる削除を拒否する', async () => {
    authState.userIndex = null

    const response = await app.request('/api/hiroba-posts/hiroba-post-1', { method: 'DELETE' })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(prismaMock.hirobaPost.delete).not.toHaveBeenCalled()
  })
})
