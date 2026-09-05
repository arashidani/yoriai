import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { authState, prismaMock } = vi.hoisted(() => ({
  authState: { userIndex: 0 as number | null },
  prismaMock: {
    post: {
      findUnique: vi.fn(),
    },
    aiFlag: {
      findMany: vi.fn(),
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

import app from '@/lib/hono/app'
import { MOCK_ANONYMOUS_PROFILES, MOCK_USERS } from '@/lib/mocks/fixtures'

const hiddenAt = new Date('2024-01-14T01:00:00.000Z')
const hiddenAnswer = {
  id: 'answer-hidden',
  postId: 'post-deleted',
  authorId: 'user-2',
  author: MOCK_USERS[1],
  body: '非表示になった回答です。',
  isHidden: true,
  hiddenAt,
  hiddenByUserId: null,
  hiddenReason: 'AIによる自動検出',
  likeCount: 0,
  postAnonymousProfileId: 'assignment-hidden',
  createdAt: new Date('2024-01-14T00:30:00.000Z'),
  updatedAt: hiddenAt,
  postAnonymousProfile: {
    id: 'assignment-hidden',
    postId: 'post-deleted',
    userId: 'user-2',
    anonymousProfileId: MOCK_ANONYMOUS_PROFILES[0].id,
    aliasNumber: 1,
    createdAt: new Date('2024-01-14T00:00:00.000Z'),
    anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
  },
}

const hiddenPost = {
  id: 'post-deleted',
  title: '削除済みの質問',
  body: 'AI判定によって論理削除された質問です。',
  authorId: 'user-2',
  author: MOCK_USERS[1],
  status: 'OPEN',
  answerCount: 0,
  likeCount: 0,
  resolvedAt: null,
  deletedAt: new Date('2024-01-14T00:00:00.000Z'),
  createdAt: new Date('2024-01-14T00:00:00.000Z'),
  updatedAt: hiddenAt,
  answers: [hiddenAnswer],
}

const relatedFlag = {
  id: 'flag-hidden-post',
  title: '不適切な投稿の可能性: 削除済みの質問',
  detail: '投稿内に攻撃的な表現が含まれています',
  severity: 'HIGH',
  status: 'UNREAD',
  targetUserId: 'user-2',
  targetUser: MOCK_USERS[1],
  postId: 'post-deleted',
  post: hiddenPost,
  answerId: null,
  answer: null,
  createdAt: hiddenAt,
}

describe('管理者投稿閲覧API', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    authState.userIndex = 0
    prismaMock.post.findUnique.mockImplementation(
      async (args: { where?: { id?: string; deletedAt?: Date | null } }) => {
        if (args.where?.deletedAt !== undefined) return null
        if (args.where?.id !== 'post-deleted') return null
        return hiddenPost
      },
    )
    prismaMock.aiFlag.findMany.mockResolvedValue([relatedFlag])
  })

  it('非表示の投稿でもタイトルと本文を返す', async () => {
    const response = await app.request('/api/admin/posts/post-deleted')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.post).toMatchObject({
      id: 'post-deleted',
      title: '削除済みの質問',
      body: 'AI判定によって論理削除された質問です。',
      deletedAt: '2024-01-14T00:00:00.000Z',
      author: expect.objectContaining({ id: 'user-2', name: '一般ユーザー' }),
    })
  })

  it('非表示の回答も本文付きで返す', async () => {
    const response = await app.request('/api/admin/posts/post-deleted')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.answers).toEqual([
      expect.objectContaining({
        id: 'answer-hidden',
        body: '非表示になった回答です。',
        isHidden: true,
        hiddenAt: '2024-01-14T01:00:00.000Z',
        hiddenReason: 'AIによる自動検出',
        author: expect.objectContaining({ id: 'user-2', name: '一般ユーザー' }),
      }),
    ])
  })

  it('関連するAIフラグの判定理由と重要度を返す', async () => {
    const response = await app.request('/api/admin/posts/post-deleted')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.flags).toEqual([
      expect.objectContaining({
        id: 'flag-hidden-post',
        detail: '投稿内に攻撃的な表現が含まれています',
        severity: 'HIGH',
      }),
    ])
  })

  it('存在しない投稿は404を返す', async () => {
    const response = await app.request('/api/admin/posts/missing-post')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })

  it('一般ユーザーによる閲覧を拒否する', async () => {
    authState.userIndex = 1

    const response = await app.request('/api/admin/posts/post-deleted')

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(prismaMock.post.findUnique).not.toHaveBeenCalled()
  })

  it('未認証ユーザーによる閲覧を拒否する', async () => {
    authState.userIndex = null

    const response = await app.request('/api/admin/posts/post-deleted')

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(prismaMock.post.findUnique).not.toHaveBeenCalled()
  })
})
