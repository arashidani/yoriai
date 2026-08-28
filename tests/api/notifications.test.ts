import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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

import app from '@/lib/hono/app'

const postNotification = {
  id: 'notification-1',
  userId: 'user-1',
  type: 'POST_ANSWERED',
  postId: 'post-1',
  post: {
    id: 'post-1',
    title: '質問タイトル',
    body: '質問本文',
    authorId: 'user-1',
    status: 'ANSWERED',
    answerCount: 1,
    likeCount: 0,
    resolvedAt: null,
    deletedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  answerId: null,
  answer: null,
  isRead: false,
  createdAt: new Date('2024-01-02T00:00:00Z'),
}

const answerNotification = {
  ...postNotification,
  id: 'notification-2',
  type: 'ANSWER_HIDDEN',
  postId: null,
  post: null,
  answerId: 'answer-1',
  answer: {
    id: 'answer-1',
    postId: 'post-1',
    body: '回答本文',
    isHidden: true,
    likeCount: 0,
    postAnonymousProfile: {
      aliasNumber: 1,
      anonymousProfile: {
        id: 'anon-1',
        displayName: 'ねこ',
        avatarUrls: ['/anonymous-profiles/cat.svg'],
      },
    },
    createdAt: new Date('2024-01-01T01:00:00Z'),
    updatedAt: new Date('2024-01-01T01:00:00Z'),
  },
}

describe('通知API', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('関連オブジェクトを含む通知一覧をカーソル付きで返す', async () => {
    prismaMock.notification.findMany.mockResolvedValue([
      postNotification,
      answerNotification,
      { ...postNotification, id: 'notification-0' },
    ])

    const response = await app.request('/api/notifications?limit=2')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      notifications: [
        { id: 'notification-1', post: { id: 'post-1' } },
        {
          id: 'notification-2',
          answer: {
            id: 'answer-1',
            anonymousProfile: {
              displayName: 'ねこ',
              avatarUrl: '/anonymous-profiles/cat.svg',
            },
          },
        },
      ],
      nextCursor: 'notification-2',
    })
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' }, take: 3 }),
    )
  })

  it('未読件数を返す', async () => {
    prismaMock.notification.count.mockResolvedValue(3)

    const response = await app.request('/api/notifications/unread-count')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ count: 3 })
  })

  it('自分宛て以外の通知は既読にしない', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({
      ...postNotification,
      userId: 'user-2',
    })

    const response = await app.request('/api/notifications/notification-1', { method: 'PATCH' })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(prismaMock.notification.update).not.toHaveBeenCalled()
  })

  it('通知を既読にして更新後のオブジェクトを返す', async () => {
    prismaMock.notification.findUnique.mockResolvedValue(postNotification)
    prismaMock.notification.update.mockResolvedValue({ ...postNotification, isRead: true })

    const response = await app.request('/api/notifications/notification-1', { method: 'PATCH' })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      notification: { id: 'notification-1', isRead: true },
    })
  })

  it('未読通知をすべて既読にする', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 4 })

    const response = await app.request('/api/notifications/read-all', { method: 'PATCH' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ count: 4 })
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
      data: { isRead: true },
    })
  })
})
