import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, txMock } = vi.hoisted(() => ({
  txMock: {
    answer: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    post: {
      update: vi.fn(),
    },
  },
  prismaMock: {
    answer: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
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
import { MOCK_ANONYMOUS_PROFILES } from '@/lib/mocks/fixtures'

const restoredAnswer = {
  id: 'answer-test',
  postId: 'post-test',
  authorId: 'user-test',
  body: '回答テスト',
  isHidden: false,
  hiddenAt: null,
  hiddenByUserId: null,
  hiddenReason: null,
  likeCount: 0,
  createdAt: new Date('2026-08-08T00:00:00.000Z'),
  updatedAt: new Date('2026-08-08T00:00:00.000Z'),
  postAnonymousProfile: {
    aliasNumber: 1,
    anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
  },
}

describe('管理者回答復元API', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.resetAllMocks()
    prismaMock.answer.findUnique.mockResolvedValue({
      id: restoredAnswer.id,
      postId: restoredAnswer.postId,
      isHidden: true,
    })
    txMock.answer.findUnique.mockResolvedValue(restoredAnswer)
    txMock.post.update.mockResolvedValue({ id: restoredAnswer.postId, answerCount: 1 })
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock))
  })

  it('非公開回答を復元したときだけ公開回答件数を増やす', async () => {
    txMock.answer.updateMany.mockResolvedValue({ count: 1 })

    const response = await app.request(`/api/admin/answers/${restoredAnswer.id}/restore`, {
      method: 'PATCH',
    })

    expect(response.status).toBe(200)
    expect(txMock.answer.updateMany).toHaveBeenCalledWith({
      where: { id: restoredAnswer.id, isHidden: true },
      data: { isHidden: false, hiddenAt: null, hiddenByUserId: null, hiddenReason: null },
    })
    expect(txMock.post.update).toHaveBeenCalledWith({
      where: { id: restoredAnswer.postId },
      data: { answerCount: { increment: 1 } },
    })
  })

  it('すでに公開中なら回答件数を増やさない', async () => {
    txMock.answer.updateMany.mockResolvedValue({ count: 0 })

    const response = await app.request(`/api/admin/answers/${restoredAnswer.id}/restore`, {
      method: 'PATCH',
    })

    expect(response.status).toBe(200)
    expect(txMock.post.update).not.toHaveBeenCalled()
  })
})
