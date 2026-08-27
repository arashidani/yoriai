import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { moderationMock, prismaMock, txMock } = vi.hoisted(() => ({
  moderationMock: {
    moderatePost: vi.fn(),
    moderateAnswer: vi.fn(),
  },
  txMock: {
    hirobaAnswer: {
      create: vi.fn(),
    },
    hirobaPost: {
      update: vi.fn(),
    },
  },
  prismaMock: {
    hirobaPost: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    hirobaAnswer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    hirobaMembership: {
      findUnique: vi.fn(),
    },
    aiFlag: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))
vi.mock('@/lib/ai/moderate-post', () => moderationMock)

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

import { DEFAULT_HIROBA_SLUGS, HIROBA_CATALOG } from '@/lib/hiroba/catalog'
import app from '@/lib/hono/app'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

/** 参加チェックを通すため、誰でも投稿できるデフォルトひろばを使う */
const defaultHiroba = HIROBA_CATALOG.find((hiroba) => hiroba.slug === DEFAULT_HIROBA_SLUGS[0])

const basePost = {
  id: 'hiroba-post-test',
  hirobaId: defaultHiroba?.id,
  title: 'ひろば投稿テスト',
  authorId: MOCK_USERS[0].id,
  author: MOCK_USERS[0],
  answerCount: 0,
  likeCount: 0,
  imageUrl: null,
  deletedAt: null,
  createdAt: new Date('2026-08-08T00:00:00.000Z'),
  updatedAt: new Date('2026-08-08T00:00:00.000Z'),
}

const baseAnswer = {
  id: 'hiroba-answer-test',
  hirobaPostId: basePost.id,
  authorId: MOCK_USERS[0].id,
  author: MOCK_USERS[0],
  body: 'ひろば回答テスト',
  isHidden: false,
  likeCount: 0,
  createdAt: new Date('2026-08-08T01:00:00.000Z'),
  updatedAt: new Date('2026-08-08T01:00:00.000Z'),
}

function createAnswerRequest(body: object) {
  return app.request(`/api/hiroba-posts/${basePost.id}/answers`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
    },
    body: JSON.stringify(body),
  })
}

describe('ひろば回答APIのモデレーション結果', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.resetAllMocks()
    prismaMock.hirobaPost.findFirst.mockResolvedValue(basePost)
    txMock.hirobaAnswer.create.mockResolvedValue(baseAnswer)
    txMock.hirobaPost.update.mockResolvedValue({ ...basePost, answerCount: 1 })
    moderationMock.moderateAnswer.mockResolvedValue(null)
    prismaMock.$transaction.mockImplementation(async (operation) => {
      if (Array.isArray(operation)) return Promise.all(operation)
      return operation(txMock)
    })
  })

  it('AI判定で非公開になった回答は投稿の回答数を1件減らす', async () => {
    prismaMock.aiFlag.create.mockResolvedValue({ id: 'flag-test' })
    prismaMock.hirobaAnswer.update.mockResolvedValue({ ...baseAnswer, isHidden: true })
    moderationMock.moderateAnswer.mockResolvedValue({
      flagged: true,
      severity: 'HIGH',
      reason: 'テスト判定',
    })

    const response = await createAnswerRequest({ body: baseAnswer.body })

    expect(response.status).toBe(201)
    expect(txMock.hirobaPost.update).toHaveBeenCalledWith({
      where: { id: basePost.id },
      data: { answerCount: { increment: 1 } },
    })
    expect(prismaMock.hirobaPost.update).toHaveBeenCalledWith({
      where: { id: baseAnswer.hirobaPostId },
      data: { answerCount: { decrement: 1 } },
    })
    expect((await response.json()).answer.isHidden).toBe(true)
  })

  it('AI判定で非公開にならない回答では投稿の回答数を減らさない', async () => {
    const response = await createAnswerRequest({ body: baseAnswer.body })

    expect(response.status).toBe(201)
    expect(txMock.hirobaPost.update).toHaveBeenCalledWith({
      where: { id: basePost.id },
      data: { answerCount: { increment: 1 } },
    })
    expect(prismaMock.hirobaPost.update).not.toHaveBeenCalled()
    expect((await response.json()).answer.isHidden).toBe(false)
  })
})
