import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { assignTagsMock, assignmentMock, moderationMock, prismaMock, txMock } = vi.hoisted(() => ({
  assignTagsMock: vi.fn(),
  assignmentMock: {
    getOrAssignAnonymousProfile: vi.fn(),
  },
  moderationMock: {
    moderatePost: vi.fn(),
    moderateAnswer: vi.fn(),
  },
  txMock: {
    answer: {
      create: vi.fn(),
    },
    post: {
      update: vi.fn(),
    },
  },
  prismaMock: {
    post: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    answer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    aiFlag: {
      create: vi.fn(),
    },
    tag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    postTag: {
      createMany: vi.fn(),
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
vi.mock('@/lib/questions/assign-anonymous-profile', () => assignmentMock)
vi.mock('@/lib/ai/assign-tags', () => ({ assignTagsWithStatus: assignTagsMock }))

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
import { QuestionStatus } from '@/app/generated/prisma/enums'
import app from '@/lib/hono/app'
import { MOCK_ANONYMOUS_PROFILES, MOCK_USERS } from '@/lib/mocks/fixtures'

const basePost = {
  id: 'post-test',
  title: '質問テスト',
  body: '本文テスト',
  authorId: MOCK_USERS[0].id,
  author: MOCK_USERS[0],
  status: QuestionStatus.OPEN,
  answerCount: 0,
  likeCount: 0,
  resolvedAt: null,
  deletedAt: null,
  createdAt: new Date('2026-08-08T00:00:00.000Z'),
  updatedAt: new Date('2026-08-08T00:00:00.000Z'),
}

const baseAnswer = {
  id: 'answer-test',
  postId: basePost.id,
  authorId: MOCK_USERS[0].id,
  author: MOCK_USERS[0],
  body: '回答テスト',
  isHidden: false,
  likeCount: 0,
  createdAt: new Date('2026-08-08T01:00:00.000Z'),
  updatedAt: new Date('2026-08-08T01:00:00.000Z'),
  postAnonymousProfile: {
    anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
  },
}

function p2002Error() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
    code: 'P2002',
    clientVersion: '7.9.0',
  })
}

function createRequest(path: string, body: object) {
  return app.request(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
    },
    body: JSON.stringify(body),
  })
}

describe('Q&A作成APIのモデレーション結果', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.resetAllMocks()
    assignmentMock.getOrAssignAnonymousProfile.mockResolvedValue({ id: 'assignment-test' })
    moderationMock.moderatePost.mockResolvedValue(null)
    moderationMock.moderateAnswer.mockResolvedValue(null)
    assignTagsMock.mockResolvedValue({ status: 'failed', tagNames: [] })
    prismaMock.tag.findMany.mockResolvedValue([])
    prismaMock.postTag.createMany.mockResolvedValue({ count: 0 })
    prismaMock.$transaction.mockImplementation(async (operation) => {
      if (Array.isArray(operation)) return Promise.all(operation)
      return operation(txMock)
    })
  })

  it('AI判定で非公開になった質問にisHidden=trueを返す', async () => {
    prismaMock.post.create.mockResolvedValue(basePost)
    prismaMock.post.update
      .mockResolvedValueOnce({ ...basePost, postAnonymousProfileId: 'assignment-test' })
      .mockResolvedValueOnce({ ...basePost, deletedAt: new Date('2026-08-08T02:00:00.000Z') })
    prismaMock.aiFlag.create.mockResolvedValue({ id: 'flag-test' })
    moderationMock.moderatePost.mockResolvedValue({
      flagged: true,
      severity: 'HIGH',
      reason: 'テスト判定',
    })

    const response = await createRequest('/api/questions', {
      title: basePost.title,
      body: basePost.body,
    })

    expect(response.status).toBe(201)
    expect((await response.json()).moderation).toEqual({ isHidden: true })
  })

  it('その他タグが手動指定された質問ではAI割り当てをスキップする', async () => {
    const manualTag = {
      id: 'tag-other',
      name: 'その他（雑談に近い質問）',
      category: 'その他',
      categoryDefinition: { id: 'category-other', name: 'その他' },
      description: null,
      createdAt: new Date('2026-08-08T00:00:00.000Z'),
    }
    prismaMock.tag.findUnique.mockResolvedValue(manualTag)
    prismaMock.post.create.mockResolvedValue(basePost)
    prismaMock.post.update.mockResolvedValue({
      ...basePost,
      postAnonymousProfileId: 'assignment-test',
    })

    const response = await createRequest('/api/questions', {
      title: basePost.title,
      body: basePost.body,
      tagId: manualTag.id,
    })

    expect(response.status).toBe(201)
    expect(prismaMock.tag.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: manualTag.id, isWorkTag: true } }),
    )
    expect(prismaMock.postTag.createMany).toHaveBeenCalledWith({
      data: [{ postId: basePost.id, tagId: manualTag.id }],
      skipDuplicates: true,
    })
    expect(assignTagsMock).not.toHaveBeenCalled()
    expect(prismaMock.tag.findMany).not.toHaveBeenCalled()
  })

  it('存在しない手動タグは400を返し、質問を作成しない', async () => {
    prismaMock.tag.findUnique.mockResolvedValue(null)

    const response = await createRequest('/api/questions', {
      title: basePost.title,
      body: basePost.body,
      tagId: 'missing-tag',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: '指定されたタグが見つかりません' })
    expect(prismaMock.post.create).not.toHaveBeenCalled()
    expect(assignTagsMock).not.toHaveBeenCalled()
  })

  it('投稿者が失敗後に手動でタグを付与できる', async () => {
    const tag = {
      id: 'tag-manual',
      name: '勤怠・有給関連',
      category: '社内ルール・手続き',
      description: null,
    }
    prismaMock.post.findUnique.mockResolvedValue({ ...basePost, tags: [] })
    prismaMock.tag.findMany.mockResolvedValue([tag])

    const response = await app.request(`/api/questions/${basePost.id}/tag-assignment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'manual', tagId: tag.id }),
    })

    expect(response.status).toBe(200)
    expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: tag.id, isWorkTag: true } }),
    )
    expect(await response.json()).toEqual({ tag: { id: tag.id, name: tag.name } })
    expect(prismaMock.postTag.createMany).toHaveBeenCalledWith({
      data: [{ postId: basePost.id, tagId: tag.id }],
      skipDuplicates: true,
    })
  })

  it('ユーザー操作によるAI再試行が失敗した場合は503を返す', async () => {
    prismaMock.post.findUnique.mockResolvedValue({ ...basePost, tags: [] })
    prismaMock.tag.findMany.mockResolvedValue([
      { id: 'tag-ai', name: 'その他', category: 'その他', description: null },
    ])
    assignTagsMock.mockResolvedValue({ status: 'failed', tagNames: [] })

    const response = await app.request(`/api/questions/${basePost.id}/tag-assignment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'ai' }),
    })

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'AIによるタグ付与に失敗しました' })
  })

  it('質問の冪等再送でも保存済みの非公開状態を返す', async () => {
    prismaMock.post.create.mockRejectedValue(p2002Error())
    prismaMock.post.findUnique.mockResolvedValue({
      ...basePost,
      deletedAt: new Date('2026-08-08T02:00:00.000Z'),
      tags: [],
    })

    const response = await createRequest('/api/questions', {
      title: basePost.title,
      body: basePost.body,
    })

    expect(response.status).toBe(200)
    expect((await response.json()).moderation).toEqual({ isHidden: true })
    expect(moderationMock.moderatePost).not.toHaveBeenCalled()
  })

  it('AI判定で非公開になった回答にisHidden=trueを返す', async () => {
    prismaMock.post.findUnique.mockResolvedValue(basePost)
    txMock.answer.create.mockResolvedValue(baseAnswer)
    txMock.post.update.mockResolvedValue({ ...basePost, answerCount: 1 })
    prismaMock.aiFlag.create.mockResolvedValue({ id: 'flag-test' })
    prismaMock.answer.update.mockResolvedValue({ ...baseAnswer, isHidden: true })
    moderationMock.moderateAnswer.mockResolvedValue({
      flagged: true,
      severity: 'HIGH',
      reason: 'テスト判定',
    })

    const response = await createRequest('/api/questions/post-test/answers', {
      body: baseAnswer.body,
    })

    expect(response.status).toBe(201)
    expect(txMock.post.update).toHaveBeenCalledWith({
      where: { id: basePost.id },
      data: {
        answerCount: { increment: 1 },
        activityAt: baseAnswer.createdAt,
      },
    })
    expect((await response.json()).moderation).toEqual({ isHidden: true })
  })

  it('匿名プロフィールIDのメンションを実ユーザーIDへ解決して通知する', async () => {
    prismaMock.post.findUnique.mockResolvedValue(basePost)
    prismaMock.post.findFirst.mockResolvedValue({
      authorId: basePost.authorId,
      postAnonymousProfile: {
        id: 'assignment-user-1',
        aliasNumber: 1,
        anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
      },
      answers: [
        {
          authorId: MOCK_USERS[1].id,
          postAnonymousProfile: {
            id: 'assignment-user-2',
            aliasNumber: 1,
            anonymousProfile: MOCK_ANONYMOUS_PROFILES[1],
          },
        },
      ],
    })
    txMock.answer.create.mockResolvedValue(baseAnswer)
    txMock.post.update.mockResolvedValue({ ...basePost, answerCount: 1 })

    const response = await createRequest('/api/questions/post-test/answers', {
      body: '@いぬ 回答テスト',
      mentionedUserIds: ['assignment-user-2'],
    })

    expect(response.status).toBe(201)
    expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: MOCK_USERS[1].id,
          type: 'MENTIONED',
          postId: basePost.id,
          answerId: baseAnswer.id,
        },
      ],
    })
  })

  it('本文にない匿名プロフィールIDのメンションを拒否する', async () => {
    prismaMock.post.findUnique.mockResolvedValue(basePost)
    prismaMock.post.findFirst.mockResolvedValue({
      authorId: basePost.authorId,
      postAnonymousProfile: {
        id: 'assignment-user-1',
        aliasNumber: 1,
        anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
      },
      answers: [
        {
          authorId: MOCK_USERS[1].id,
          postAnonymousProfile: {
            id: 'assignment-user-2',
            aliasNumber: 1,
            anonymousProfile: MOCK_ANONYMOUS_PROFILES[1],
          },
        },
      ],
    })

    const response = await createRequest('/api/questions/post-test/answers', {
      body: baseAnswer.body,
      mentionedUserIds: ['assignment-user-2'],
    })

    expect(response.status).toBe(400)
    expect(txMock.answer.create).not.toHaveBeenCalled()
    expect(prismaMock.notification.createMany).not.toHaveBeenCalled()
  })

  it('回答の冪等再送でも保存済みの非公開状態を返す', async () => {
    prismaMock.post.findUnique.mockResolvedValue(basePost)
    txMock.answer.create.mockRejectedValue(p2002Error())
    prismaMock.answer.findUnique.mockResolvedValue({ ...baseAnswer, isHidden: true })

    const response = await createRequest('/api/questions/post-test/answers', {
      body: baseAnswer.body,
    })

    expect(response.status).toBe(200)
    expect((await response.json()).moderation).toEqual({ isHidden: true })
    expect(moderationMock.moderateAnswer).not.toHaveBeenCalled()
  })
})
