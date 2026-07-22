import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type {
  AnonymousProfile,
  Answer,
  Post,
  PostAnonymousProfile,
  User,
} from '@/app/generated/prisma/client'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagSeverity, QuestionStatus, Role } from '@/app/generated/prisma/enums'
import { moderateAnswer, moderatePost } from '@/lib/ai/moderate-post'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  AnswerSchema,
  errorResponse,
  IdParamSchema,
  LikeStatusSchema,
  PostSchema,
  SavedStatusSchema,
  SuccessSchema,
} from '@/lib/hono/openapi/schemas'
import { MOCK_ANSWERS, MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { getOrAssignAnonymousProfile } from '@/lib/questions/assign-anonymous-profile'
import { createAnswerSchema } from '@/lib/schemas/answer'
import { createPostSchema } from '@/lib/schemas/post'

type PostWithAuthor = Post & { author: User | null }
type AnswerWithAnonymousProfile = Answer & {
  postAnonymousProfile: PostAnonymousProfile & { anonymousProfile: AnonymousProfile }
}

export function toAnswerResponse(answer: AnswerWithAnonymousProfile) {
  return {
    id: answer.id,
    postId: answer.postId,
    body: answer.body,
    isHidden: answer.isHidden,
    likeCount: answer.likeCount,
    anonymousProfile: {
      id: answer.postAnonymousProfile.anonymousProfile.id,
      displayName: answer.postAnonymousProfile.anonymousProfile.displayName,
      avatarUrl: answer.postAnonymousProfile.anonymousProfile.avatarUrl,
    },
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['posts'],
  summary: '投稿一覧を取得',
  responses: {
    200: {
      description: '投稿一覧',
      content: { 'application/json': { schema: z.object({ posts: z.array(PostSchema) }) } },
    },
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['posts'],
  summary: '投稿を1件取得',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '投稿詳細',
      content: { 'application/json': { schema: z.object({ post: PostSchema }) } },
    },
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const createPostRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['posts'],
  summary: '投稿を作成',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    headers: z.object({
      'idempotency-key': z.string().uuid().openapi({
        description: '通信失敗後に同じ投稿を再送しても、重複作成しないためのUUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    }),
    body: { required: true, content: { 'application/json': { schema: createPostSchema } } },
  },
  responses: {
    201: {
      description: '作成された投稿',
      content: { 'application/json': { schema: z.object({ post: PostSchema }) } },
    },
    200: {
      description: '再送された投稿（すでに作成済みの投稿）',
      content: { 'application/json': { schema: z.object({ post: PostSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    409: errorResponse(
      '同じキーで、前回とは異なる投稿内容が送信された',
      '同じ投稿操作に異なる内容が指定されています',
    ),
    500: errorResponse('投稿の作成に失敗した', '投稿の作成に失敗しました'),
  },
})

const listAnswersRoute = createRoute({
  method: 'get',
  path: '/{id}/answers',
  tags: ['posts'],
  summary: '質問への回答一覧を取得（いいね数の多い順、同数なら投稿順）',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '回答一覧',
      content: { 'application/json': { schema: z.object({ answers: z.array(AnswerSchema) }) } },
    },
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const createAnswerRoute = createRoute({
  method: 'post',
  path: '/{id}/answers',
  tags: ['posts'],
  summary: '質問に回答を投稿',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: IdParamSchema,
    headers: z.object({
      'idempotency-key': z.string().uuid().openapi({
        description: '通信失敗後に同じ回答を再送しても、重複作成しないためのUUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    }),
    body: { required: true, content: { 'application/json': { schema: createAnswerSchema } } },
  },
  responses: {
    201: {
      description: '作成された回答',
      content: { 'application/json': { schema: z.object({ answer: AnswerSchema }) } },
    },
    200: {
      description: '再送された回答（すでに作成済みの回答）',
      content: { 'application/json': { schema: z.object({ answer: AnswerSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    409: errorResponse('解決済み・非表示の質問には回答できない', '回答を受け付けていない質問です'),
    500: errorResponse('回答の作成に失敗した', '回答の作成に失敗しました'),
  },
})

const resolveRoute = createRoute({
  method: 'post',
  path: '/{id}/resolve',
  tags: ['posts'],
  summary: '質問を解決済みにする（質問者のみ）',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '解決済みにした質問',
      content: { 'application/json': { schema: z.object({ post: PostSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('質問者以外による操作', 'Forbidden'),
    404: errorResponse('質問が見つからない', 'Not found'),
    409: errorResponse('非表示の質問は解決済みにできない', '操作できない質問の状態です'),
  },
})

const likeRoute = createRoute({
  method: 'post',
  path: '/{id}/likes',
  tags: ['posts'],
  summary: '質問にいいねする',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'いいね後の状態',
      content: { 'application/json': { schema: LikeStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('自分の質問にはいいねできない', '自分の質問にはいいねできません'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('いいねの処理に失敗した', 'いいねの処理に失敗しました'),
  },
})

const unlikeRoute = createRoute({
  method: 'delete',
  path: '/{id}/likes',
  tags: ['posts'],
  summary: '質問へのいいねを取り消す',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'いいね取り消し後の状態',
      content: { 'application/json': { schema: LikeStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('いいね取り消しの処理に失敗した', 'いいね取り消しの処理に失敗しました'),
  },
})

const bookmarkRoute = createRoute({
  method: 'post',
  path: '/{id}/bookmarks',
  tags: ['posts'],
  summary: '質問を保存する',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存後の状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('保存の処理に失敗した', '保存の処理に失敗しました'),
  },
})

const unbookmarkRoute = createRoute({
  method: 'delete',
  path: '/{id}/bookmarks',
  tags: ['posts'],
  summary: '質問の保存を取り消す',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存取り消し後の状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('保存取り消しの処理に失敗した', '保存取り消しの処理に失敗しました'),
  },
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['posts'],
  summary: '投稿を削除（管理者、または回答が付く前の質問者本人）',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者・質問者本人以外）', 'Forbidden'),
    404: errorResponse('質問が見つからない', 'Not found'),
    409: errorResponse(
      '回答が付いている質問は質問者本人には削除できない',
      '回答がある質問は削除できません',
    ),
  },
})

export const postsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ posts: MOCK_POSTS }, 200)
    }
    const posts = await prisma.post.findMany({
      where: { deletedAt: null },
      include: { author: true },
      orderBy: { updatedAt: 'desc' },
    })
    return c.json({ posts }, 200)
  })
  .openapi(getRoute, async (c) => {
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ post }, 200)
    }
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: { author: true },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    return c.json({ post }, 200)
  })
  .openapi(createPostRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const user = c.get('user')
      const data = c.req.valid('json')

      return c.json(
        {
          post: {
            id: `post-${Date.now()}`,
            ...data,
            authorId: user.id,
            author: user,
            status: QuestionStatus.OPEN,
            answerCount: 0,
            likeCount: 0,
            resolvedAt: null,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        201,
      )
    }

    const user = c.get('user')
    const data = c.req.valid('json')
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')

    let post: PostWithAuthor
    try {
      post = await prisma.post.create({
        data: { ...data, authorId: user.id, idempotencyKey },
        include: { author: true },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        return c.json({ error: '投稿の作成に失敗しました' }, 500)
      }

      let existingPost: PostWithAuthor | null
      try {
        existingPost = await prisma.post.findUnique({
          where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
          include: { author: true },
        })
      } catch {
        return c.json({ error: '投稿の作成に失敗しました' }, 500)
      }

      if (!existingPost) return c.json({ error: '投稿の作成に失敗しました' }, 500)
      if (existingPost.title !== data.title || existingPost.body !== data.body) {
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      }

      return c.json({ post: existingPost }, 200)
    }

    try {
      const assignment = await getOrAssignAnonymousProfile(post.id, user.id)
      post = await prisma.post.update({
        where: { id: post.id },
        data: { postAnonymousProfileId: assignment.id },
        include: { author: true },
      })
    } catch (error) {
      console.error('Failed to assign anonymous profile', { postId: post.id, error })
    }

    const moderation = await moderatePost(post.title, post.body)
    if (moderation?.flagged) {
      try {
        const [, flaggedPost] = await prisma.$transaction([
          prisma.aiFlag.create({
            data: {
              title: `不適切な投稿の可能性: ${post.title}`,
              detail: moderation.reason,
              severity: FlagSeverity[moderation.severity],
              targetUserId: user.id,
              postId: post.id,
            },
          }),
          prisma.post.update({
            where: { id: post.id },
            data: { deletedAt: new Date() },
            include: { author: true },
          }),
        ])
        post = flaggedPost
      } catch (error) {
        console.error('Failed to create AI flag', { postId: post.id, error })
      }
    }

    return c.json({ post }, 201)
  })
  .openapi(listAnswersRoute, async (c) => {
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_ANSWERS.filter((a) => a.postId === id)
      return c.json({ answers }, 200)
    }

    const post = await prisma.post.findFirst({ where: { id, deletedAt: null } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    const answers = await prisma.answer.findMany({
      where: { postId: id, isHidden: false },
      include: { postAnonymousProfile: { include: { anonymousProfile: true } } },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
    })
    return c.json({ answers: answers.map(toAnswerResponse) }, 200)
  })
  .openapi(createAnswerRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const data = c.req.valid('json')
      return c.json(
        {
          answer: {
            id: `answer-${Date.now()}`,
            postId: id,
            body: data.body,
            isHidden: false,
            likeCount: 0,
            anonymousProfile: MOCK_ANSWERS[0].anonymousProfile,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        201,
      )
    }

    const user = c.get('user')
    const data = c.req.valid('json')
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')

    const post = await prisma.post.findFirst({ where: { id, deletedAt: null } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.status !== QuestionStatus.OPEN && post.status !== QuestionStatus.ANSWERED) {
      return c.json({ error: '回答を受け付けていない質問です' }, 409)
    }

    let assignment: PostAnonymousProfile
    try {
      assignment = await getOrAssignAnonymousProfile(id, user.id)
    } catch (error) {
      console.error('Failed to assign anonymous profile', { postId: id, error })
      return c.json({ error: '回答の作成に失敗しました' }, 500)
    }

    let answer: AnswerWithAnonymousProfile
    try {
      answer = await prisma.$transaction(async (tx) => {
        const created = await tx.answer.create({
          data: {
            postId: id,
            authorId: user.id,
            postAnonymousProfileId: assignment.id,
            body: data.body,
            idempotencyKey,
          },
          include: { postAnonymousProfile: { include: { anonymousProfile: true } } },
        })

        await tx.post.update({
          where: { id },
          data: {
            answerCount: { increment: 1 },
            status: post.status === QuestionStatus.OPEN ? QuestionStatus.ANSWERED : post.status,
          },
        })

        return created
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        console.error('Failed to create answer', { postId: id, error })
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      }

      let existingAnswer: AnswerWithAnonymousProfile | null
      try {
        existingAnswer = await prisma.answer.findUnique({
          where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
          include: { postAnonymousProfile: { include: { anonymousProfile: true } } },
        })
      } catch {
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      }

      if (!existingAnswer) return c.json({ error: '回答の作成に失敗しました' }, 500)
      if (existingAnswer.body !== data.body) {
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      }

      return c.json({ answer: toAnswerResponse(existingAnswer) }, 200)
    }

    const moderation = await moderateAnswer(answer.body)
    if (moderation?.flagged) {
      try {
        const [, hiddenAnswer] = await prisma.$transaction([
          prisma.aiFlag.create({
            data: {
              title: '不適切な回答の可能性',
              detail: moderation.reason,
              severity: FlagSeverity[moderation.severity],
              targetUserId: user.id,
              answerId: answer.id,
            },
          }),
          prisma.answer.update({
            where: { id: answer.id },
            data: { isHidden: true, hiddenAt: new Date(), hiddenReason: 'AIによる自動検出' },
            include: { postAnonymousProfile: { include: { anonymousProfile: true } } },
          }),
        ])
        answer = hiddenAnswer
      } catch (error) {
        console.error('Failed to create AI flag', { answerId: answer.id, error })
      }
    }

    return c.json({ answer: toAnswerResponse(answer) }, 201)
  })
  .openapi(resolveRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      return c.json(
        { post: { ...post, status: QuestionStatus.RESOLVED, resolvedAt: new Date() } },
        200,
      )
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
    if (post.status === QuestionStatus.HIDDEN || post.deletedAt) {
      return c.json({ error: '操作できない質問の状態です' }, 409)
    }

    const resolved = await prisma.post.update({
      where: { id },
      data: { status: QuestionStatus.RESOLVED, resolvedAt: new Date() },
      include: { author: true },
    })
    return c.json({ post: resolved }, 200)
  })
  .openapi(likeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId === user.id) return c.json({ error: '自分の質問にはいいねできません' }, 403)
      return c.json({ liked: true, likeCount: post.likeCount + 1 }, 200)
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.authorId === user.id) return c.json({ error: '自分の質問にはいいねできません' }, 403)

    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.questionLike.createMany({
        data: [{ postId: id, userId: user.id }],
        skipDuplicates: true,
      })
      const likeCount = await tx.questionLike.count({ where: { postId: id } })
      await tx.post.update({ where: { id }, data: { likeCount } })
      return likeCount
    })
    return c.json({ liked: true, likeCount }, 200)
  })
  .openapi(unlikeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ liked: false, likeCount: Math.max(0, post.likeCount - 1) }, 200)
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.questionLike.deleteMany({ where: { postId: id, userId: user.id } })
      const likeCount = await tx.questionLike.count({ where: { postId: id } })
      await tx.post.update({ where: { id }, data: { likeCount } })
      return likeCount
    })
    return c.json({ liked: false, likeCount }, 200)
  })
  .openapi(bookmarkRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ saved: true }, 200)
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    try {
      await prisma.postBookmark.create({ data: { postId: id, userId: user.id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return c.json({ saved: true }, 200)
      }
      return c.json({ error: '保存の処理に失敗しました' }, 500)
    }
    return c.json({ saved: true }, 200)
  })
  .openapi(unbookmarkRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ saved: false }, 200)
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    await prisma.postBookmark.deleteMany({ where: { postId: id, userId: user.id } })
    return c.json({ saved: false }, 200)
  })
  .openapi(deleteRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    if (user.role !== Role.ADMIN) {
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      if (post.answerCount > 0) return c.json({ error: '回答がある質問は削除できません' }, 409)
    }

    await prisma.post.delete({ where: { id } })
    return c.json({ success: true }, 200)
  })
