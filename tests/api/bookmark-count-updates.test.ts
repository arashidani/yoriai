import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    post: { findUnique: vi.fn(), update: vi.fn() },
    postBookmark: { createMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
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

const endpoint = '/api/questions/question-1/bookmarks'

describe('質問Bookmark数の差分更新', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    )
    prismaMock.post.findUnique.mockResolvedValue({ id: 'question-1', bookmarkCount: 5 })
  })

  it('新規BookmarkはCOUNT再計算せずincrementする', async () => {
    prismaMock.postBookmark.createMany.mockResolvedValue({ count: 1 })
    prismaMock.post.update.mockResolvedValue({ bookmarkCount: 6 })

    const response = await app.request(endpoint, { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ saved: true, bookmarkCount: 6 })
    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: { id: 'question-1' },
      select: { id: true, bookmarkCount: true },
    })
    expect(prismaMock.postBookmark.createMany).toHaveBeenCalledWith({
      data: [{ postId: 'question-1', userId: MOCK_USERS[0].id }],
      skipDuplicates: true,
    })
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: 'question-1' },
      data: { bookmarkCount: { increment: 1 } },
      select: { bookmarkCount: true },
    })
    expect(prismaMock.postBookmark.count).not.toHaveBeenCalled()
  })

  it('重複Bookmarkではカウントを更新しない', async () => {
    prismaMock.postBookmark.createMany.mockResolvedValue({ count: 0 })

    const response = await app.request(endpoint, { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ saved: true, bookmarkCount: 5 })
    expect(prismaMock.post.update).not.toHaveBeenCalled()
    expect(prismaMock.postBookmark.count).not.toHaveBeenCalled()
  })

  it('Bookmark解除はCOUNT再計算せずdecrementする', async () => {
    prismaMock.postBookmark.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.post.update.mockResolvedValue({ bookmarkCount: 4 })

    const response = await app.request(endpoint, { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ saved: false, bookmarkCount: 4 })
    expect(prismaMock.postBookmark.deleteMany).toHaveBeenCalledWith({
      where: { postId: 'question-1', userId: MOCK_USERS[0].id },
    })
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: 'question-1' },
      data: { bookmarkCount: { decrement: 1 } },
      select: { bookmarkCount: true },
    })
    expect(prismaMock.postBookmark.count).not.toHaveBeenCalled()
  })

  it('重複Bookmark解除ではカウントを更新しない', async () => {
    prismaMock.postBookmark.deleteMany.mockResolvedValue({ count: 0 })

    const response = await app.request(endpoint, { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ saved: false, bookmarkCount: 5 })
    expect(prismaMock.post.update).not.toHaveBeenCalled()
    expect(prismaMock.postBookmark.count).not.toHaveBeenCalled()
  })
})
