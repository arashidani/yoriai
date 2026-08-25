import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { afterResponseTasks, prismaMock, scheduleAfterResponseMock, transactionNotificationCreate } =
  vi.hoisted(() => ({
    afterResponseTasks: [] as Array<() => void | Promise<void>>,
    prismaMock: {
      post: { findUnique: vi.fn(), update: vi.fn() },
      questionLike: { createMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
      answer: { findUnique: vi.fn(), update: vi.fn() },
      answerLike: { createMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
      hirobaPost: { findUnique: vi.fn(), update: vi.fn() },
      hirobaPostLike: { createMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
      hirobaAnswer: { findUnique: vi.fn(), update: vi.fn() },
      hirobaAnswerLike: { createMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
      notification: { create: vi.fn() },
      $transaction: vi.fn(),
    },
    scheduleAfterResponseMock: vi.fn((task: () => void | Promise<void>) => {
      afterResponseTasks.push(task)
    }),
    transactionNotificationCreate: vi.fn(),
  }))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))
vi.mock('@/lib/hono/after-response', () => ({ scheduleAfterResponse: scheduleAfterResponseMock }))

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

const cases = [
  {
    label: '質問',
    endpoint: '/api/questions/question-1/likes',
    id: 'question-1',
    entity: prismaMock.post,
    entitySelect: { id: true, authorId: true, likeCount: true, deletedAt: true },
    reaction: prismaMock.questionLike,
    likeData: { postId: 'question-1', userId: MOCK_USERS[0].id },
    unlikeWhere: { postId: 'question-1', userId: MOCK_USERS[0].id },
    notificationData: { userId: 'user-2', type: 'POST_LIKED', postId: 'question-1' },
  },
  {
    label: '回答',
    endpoint: '/api/answers/answer-1/likes',
    id: 'answer-1',
    entity: prismaMock.answer,
    entitySelect: { id: true, authorId: true, likeCount: true },
    reaction: prismaMock.answerLike,
    likeData: { answerId: 'answer-1', userId: MOCK_USERS[0].id },
    unlikeWhere: { answerId: 'answer-1', userId: MOCK_USERS[0].id },
    notificationData: { userId: 'user-2', type: 'ANSWER_LIKED', answerId: 'answer-1' },
  },
  {
    label: 'ひろば投稿',
    endpoint: '/api/hiroba-posts/hiroba-post-1/likes',
    id: 'hiroba-post-1',
    entity: prismaMock.hirobaPost,
    entitySelect: { id: true, authorId: true, likeCount: true },
    reaction: prismaMock.hirobaPostLike,
    likeData: { hirobaPostId: 'hiroba-post-1', userId: MOCK_USERS[0].id },
    unlikeWhere: { hirobaPostId: 'hiroba-post-1', userId: MOCK_USERS[0].id },
    notificationData: {
      userId: 'user-2',
      type: 'HIROBA_POST_LIKED',
      hirobaPostId: 'hiroba-post-1',
    },
  },
  {
    label: 'ひろば回答',
    endpoint: '/api/hiroba-answers/hiroba-answer-1/likes',
    id: 'hiroba-answer-1',
    entity: prismaMock.hirobaAnswer,
    entitySelect: { id: true, authorId: true, likeCount: true },
    reaction: prismaMock.hirobaAnswerLike,
    likeData: { hirobaAnswerId: 'hiroba-answer-1', userId: MOCK_USERS[0].id },
    unlikeWhere: { hirobaAnswerId: 'hiroba-answer-1', userId: MOCK_USERS[0].id },
    notificationData: {
      userId: 'user-2',
      type: 'HIROBA_ANSWER_LIKED',
      hirobaAnswerId: 'hiroba-answer-1',
    },
  },
]

describe.each(cases)('$labelのLike/Unlike', ({
  endpoint,
  id,
  entity,
  entitySelect,
  reaction,
  likeData,
  unlikeWhere,
  notificationData,
}) => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    afterResponseTasks.length = 0
    prismaMock.notification.create.mockReset()
    prismaMock.$transaction.mockImplementation((callback: (tx: typeof prismaMock) => unknown) =>
      callback({
        ...prismaMock,
        notification: { create: transactionNotificationCreate },
      }),
    )
    entity.findUnique.mockResolvedValue({ id, authorId: 'user-2', likeCount: 5 })
  })

  it('新規LikeはCOUNT再計算せずincrementする', async () => {
    reaction.createMany.mockResolvedValue({ count: 1 })
    entity.update.mockResolvedValue({ likeCount: 6 })

    const response = await app.request(endpoint, { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ liked: true, likeCount: 6 })
    expect(entity.findUnique).toHaveBeenCalledWith({ where: { id }, select: entitySelect })
    expect(reaction.createMany).toHaveBeenCalledWith({ data: [likeData], skipDuplicates: true })
    expect(scheduleAfterResponseMock).toHaveBeenCalledOnce()
    expect(prismaMock.notification.create).not.toHaveBeenCalled()

    await afterResponseTasks[0]?.()

    expect(prismaMock.notification.create).toHaveBeenCalledWith({ data: notificationData })
    expect(transactionNotificationCreate).not.toHaveBeenCalled()
    expect(reaction.count).not.toHaveBeenCalled()
    expect(entity.update).toHaveBeenCalledWith({
      where: { id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    })
  })

  it('重複Likeではカウントを更新しない', async () => {
    reaction.createMany.mockResolvedValue({ count: 0 })

    const response = await app.request(endpoint, { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ liked: true, likeCount: 5 })
    expect(reaction.count).not.toHaveBeenCalled()
    expect(scheduleAfterResponseMock).not.toHaveBeenCalled()
    expect(prismaMock.notification.create).not.toHaveBeenCalled()
    expect(entity.update).not.toHaveBeenCalled()
  })

  it('通知作成が失敗してもLikeは成立する', async () => {
    const error = new Error('notification failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    reaction.createMany.mockResolvedValue({ count: 1 })
    entity.update.mockResolvedValue({ likeCount: 6 })
    prismaMock.notification.create.mockRejectedValue(error)

    const response = await app.request(endpoint, { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ liked: true, likeCount: 6 })
    expect(scheduleAfterResponseMock).toHaveBeenCalledOnce()
    expect(prismaMock.notification.create).not.toHaveBeenCalled()

    await afterResponseTasks[0]?.()

    expect(prismaMock.notification.create).toHaveBeenCalledWith({ data: notificationData })
    expect(transactionNotificationCreate).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('作者がいない場合は新規Likeでも通知を作成しない', async () => {
    entity.findUnique.mockResolvedValue({ id, authorId: null, likeCount: 5 })
    reaction.createMany.mockResolvedValue({ count: 1 })
    entity.update.mockResolvedValue({ likeCount: 6 })

    const response = await app.request(endpoint, { method: 'POST' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ liked: true, likeCount: 6 })
    expect(scheduleAfterResponseMock).not.toHaveBeenCalled()
    expect(prismaMock.notification.create).not.toHaveBeenCalled()
    expect(transactionNotificationCreate).not.toHaveBeenCalled()
  })

  it('UnlikeはCOUNT再計算せずdecrementする', async () => {
    reaction.deleteMany.mockResolvedValue({ count: 1 })
    entity.update.mockResolvedValue({ likeCount: 4 })

    const response = await app.request(endpoint, { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ liked: false, likeCount: 4 })
    expect(entity.findUnique).toHaveBeenCalledWith({ where: { id }, select: entitySelect })
    expect(reaction.deleteMany).toHaveBeenCalledWith({ where: unlikeWhere })
    expect(reaction.count).not.toHaveBeenCalled()
    expect(entity.update).toHaveBeenCalledWith({
      where: { id },
      data: { likeCount: { decrement: 1 } },
      select: { likeCount: true },
    })
  })

  it('重複Unlikeではカウントを更新しない', async () => {
    reaction.deleteMany.mockResolvedValue({ count: 0 })

    const response = await app.request(endpoint, { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ liked: false, likeCount: 5 })
    expect(reaction.count).not.toHaveBeenCalled()
    expect(entity.update).not.toHaveBeenCalled()
  })
})
