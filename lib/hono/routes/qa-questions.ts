import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagSeverity, QuestionStatus, Role } from '@/app/generated/prisma/enums'
import { assignTags } from '@/lib/ai/assign-tags'
import { moderateAnswer, moderatePost } from '@/lib/ai/moderate-post'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  PageQuerySchema,
  QaAnswerSchema,
  QuestionListQuerySchema,
  QuestionListResponseSchema,
  QuestionSchema,
  QuestionTagSchema,
} from '@/lib/hono/openapi/qa-schemas'
import {
  errorResponse,
  IdParamSchema,
  LikeStatusSchema,
  SavedStatusSchema,
  SuccessSchema,
} from '@/lib/hono/openapi/schemas'
import { MOCK_ANSWERS, MOCK_POSTS, MOCK_TAGS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import {
  getMostLikedAnswerId,
  toQaAnswerResponse,
  toQuestionResponse,
} from '@/lib/questions/api-mappers'
import { getOrAssignAnonymousProfile } from '@/lib/questions/assign-anonymous-profile'
import { createAnswerSchema } from '@/lib/schemas/answer'
import { createPostSchema } from '@/lib/schemas/post'

const auth = {
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware],
}

const questionInclude = (userId: string) => ({
  author: true,
  postAnonymousProfile: { include: { anonymousProfile: true } },
  tags: {
    include: { tag: true },
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
  },
  likes: { where: { userId }, select: { userId: true } },
  bookmarks: { where: { userId }, select: { userId: true } },
})

function pagination(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) }
}

function mockQuestions(viewerId: string) {
  return MOCK_POSTS.filter((post) => !post.deletedAt).map((post) =>
    toQuestionResponse(
      {
        ...post,
        tags: post.tags.map((tag, index) => ({
          id: `mock-post-tag-${post.id}-${index}`,
          createdAt: new Date(post.createdAt.getTime() + index),
          tag,
        })),
        likes: [],
        bookmarks: [],
      },
      viewerId,
    ),
  )
}

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['questions'],
  summary: '質問一覧を検索・絞り込み・ページングして取得',
  ...auth,
  request: { query: QuestionListQuerySchema },
  responses: {
    200: {
      description: '質問一覧',
      content: { 'application/json': { schema: QuestionListResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['questions'],
  summary: '質問詳細を取得',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '質問詳細',
      content: { 'application/json': { schema: z.object({ question: QuestionSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const listAnswersRoute = createRoute({
  method: 'get',
  path: '/{id}/answers',
  tags: ['questions'],
  summary: '回答一覧を取得。募集終了済みの場合だけ最多いいね回答1件を示す',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '回答一覧',
      content: { 'application/json': { schema: z.object({ answers: z.array(QaAnswerSchema) }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const createQuestionRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['questions'],
  summary: '質問を作成',
  ...auth,
  request: {
    headers: z.object({
      'idempotency-key': z
        .string()
        .uuid()
        .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    }),
    body: { required: true, content: { 'application/json': { schema: createPostSchema } } },
  },
  responses: {
    201: {
      description: '作成成功',
      content: { 'application/json': { schema: z.object({ question: QuestionSchema }) } },
    },
    200: {
      description: '同一内容の再送',
      content: { 'application/json': { schema: z.object({ question: QuestionSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    409: errorResponse('同じキーで異なる内容', '同じ投稿操作に異なる内容が指定されています'),
    500: errorResponse('作成失敗', '投稿の作成に失敗しました'),
  },
})

const createAnswerRoute = createRoute({
  method: 'post',
  path: '/{id}/answers',
  tags: ['questions'],
  summary: '質問へ回答を投稿',
  ...auth,
  request: {
    params: IdParamSchema,
    headers: z.object({ 'idempotency-key': z.string().uuid() }),
    body: { required: true, content: { 'application/json': { schema: createAnswerSchema } } },
  },
  responses: {
    201: {
      description: '作成成功',
      content: { 'application/json': { schema: z.object({ answer: QaAnswerSchema }) } },
    },
    200: {
      description: '同一内容の再送',
      content: { 'application/json': { schema: z.object({ answer: QaAnswerSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が存在しない・削除済み', '投稿が見つかりません'),
    409: errorResponse('回答受付終了', '回答を受け付けていない質問です'),
    500: errorResponse('作成失敗', '回答の作成に失敗しました'),
  },
})

const resolveRoute = createRoute({
  method: 'post',
  path: '/{id}/resolve',
  tags: ['questions'],
  summary: '質問の募集を終了',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '募集終了',
      content: { 'application/json': { schema: z.object({ question: QuestionSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('質問者以外', 'Forbidden'),
    404: errorResponse('質問が見つからない', 'Not found'),
    409: errorResponse('操作不可', '操作できない質問の状態です'),
  },
})

const likeRoute = createRoute({
  method: 'post',
  path: '/{id}/likes',
  tags: ['questions'],
  summary: '質問に足跡を付ける',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '足跡状態', content: { 'application/json': { schema: LikeStatusSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('自分の質問', '自分の質問にはいいねできません'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('処理失敗', 'いいねの処理に失敗しました'),
  },
})

const unlikeRoute = createRoute({
  method: 'delete',
  path: '/{id}/likes',
  tags: ['questions'],
  summary: '質問の足跡を取り消す',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '足跡状態', content: { 'application/json': { schema: LikeStatusSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('処理失敗', 'いいね取り消しの処理に失敗しました'),
  },
})

const bookmarkRoute = createRoute({
  method: 'post',
  path: '/{id}/bookmarks',
  tags: ['questions'],
  summary: '質問を保存',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('処理失敗', '保存の処理に失敗しました'),
  },
})

const unbookmarkRoute = createRoute({
  method: 'delete',
  path: '/{id}/bookmarks',
  tags: ['questions'],
  summary: '質問の保存を取り消す',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['questions'],
  summary: '質問を削除',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足', 'Forbidden'),
    409: errorResponse('回答あり', '回答がある質問は削除できません'),
  },
})

export const qaQuestionsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listRoute, async (c) => {
    const user = c.get('user')
    const { page, pageSize, keyword, status, tagId } = c.req.valid('query')
    if (process.env.MOCK_MODE === 'true') {
      let questions = mockQuestions(user.id)
      if (keyword)
        questions = questions.filter((q) => q.title.includes(keyword) || q.body.includes(keyword))
      if (status === 'unanswered')
        questions = questions.filter((q) => q.status === QuestionStatus.OPEN)
      if (status === 'resolved')
        questions = questions.filter((q) => q.status === QuestionStatus.RESOLVED)
      if (tagId) questions = questions.filter((q) => q.tag?.id === tagId)
      questions.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || b.id.localeCompare(a.id),
      )
      const total = questions.length
      return c.json(
        {
          questions: questions.slice((page - 1) * pageSize, page * pageSize),
          pagination: pagination(page, pageSize, total),
        },
        200,
      )
    }

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      status:
        status === 'unanswered'
          ? QuestionStatus.OPEN
          : status === 'resolved'
            ? QuestionStatus.RESOLVED
            : { in: [QuestionStatus.OPEN, QuestionStatus.ANSWERED, QuestionStatus.RESOLVED] },
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { body: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(tagId ? { tags: { some: { tagId } } } : {}),
    }
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: questionInclude(user.id),
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])
    return c.json(
      {
        questions: posts.map((post) => toQuestionResponse(post, user.id)),
        pagination: pagination(page, pageSize, total),
      },
      200,
    )
  })
  .openapi(getRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const question = mockQuestions(user.id).find((item) => item.id === id)
      return question ? c.json({ question }, 200) : c.json({ error: 'Not found' }, 404)
    }
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
      include: questionInclude(user.id),
    })
    return post
      ? c.json({ question: toQuestionResponse(post, user.id) }, 200)
      : c.json({ error: 'Not found' }, 404)
  })
  .openapi(listAnswersRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((item) => item.id === id && !item.deletedAt)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_ANSWERS.filter(
        (answer) => answer.postId === id && !answer.isHidden,
      ).sort(
        (a, b) =>
          b.likeCount - a.likeCount ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id),
      )
      const mostLikedId = getMostLikedAnswerId(post.status, answers)
      return c.json(
        {
          answers: answers.map((answer) =>
            toQaAnswerResponse({ ...answer, likes: [] }, user.id, mostLikedId),
          ),
        },
        200,
      )
    }
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
      select: { status: true },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    const answers = await prisma.answer.findMany({
      where: { postId: id, isHidden: false },
      include: {
        author: true,
        postAnonymousProfile: { include: { anonymousProfile: true } },
        likes: { where: { userId: user.id }, select: { userId: true } },
      },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    })
    const mostLikedId = getMostLikedAnswerId(post.status, answers)
    return c.json(
      { answers: answers.map((answer) => toQaAnswerResponse(answer, user.id, mostLikedId)) },
      200,
    )
  })
  .openapi(createQuestionRoute, async (c) => {
    const user = c.get('user')
    const data = c.req.valid('json')
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')
    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          question: toQuestionResponse(
            {
              id: `post-${Date.now()}`,
              ...data,
              authorId: user.id,
              author: user,
              status: QuestionStatus.OPEN,
              answerCount: 0,
              likeCount: 0,
              resolvedAt: null,
              tags: [],
              likes: [],
              bookmarks: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            user.id,
          ),
        },
        201,
      )
    }
    // biome-ignore lint/suspicious/noExplicitAny: Prisma result variants share one variable
    let post: any
    try {
      post = await prisma.post.create({
        data: { ...data, authorId: user.id, idempotencyKey },
        include: { author: true },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
        return c.json({ error: '投稿の作成に失敗しました' }, 500)
      const existing = await prisma.post.findUnique({
        where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
        include: { author: true },
      })
      if (!existing) return c.json({ error: '投稿の作成に失敗しました' }, 500)
      if (existing.title !== data.title || existing.body !== data.body)
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      return c.json({ question: toQuestionResponse(existing, user.id) }, 200)
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
        const [, flagged] = await prisma.$transaction([
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
        post = flagged
      } catch (error) {
        console.error('Failed to create AI flag', { postId: post.id, error })
      }
    }
    // biome-ignore lint/suspicious/noExplicitAny: temporary PostTag include shape
    let tags: any[] = []
    if (!post.deletedAt) {
      try {
        const allTags = await prisma.tag.findMany({
          where: { isWorkTag: true },
          select: { id: true, name: true, createdAt: true },
        })
        const names = await assignTags(
          post.title,
          post.body,
          allTags.map((tag) => tag.name),
        )
        const selected = allTags.find((tag) => names.includes(tag.name))
        if (selected) {
          await prisma.postTag.createMany({
            data: [{ postId: post.id, tagId: selected.id }],
            skipDuplicates: true,
          })
          tags = [{ id: `assigned-${selected.id}`, createdAt: selected.createdAt, tag: selected }]
        }
      } catch (error) {
        console.error('Failed to assign tags', { postId: post.id, error })
      }
    }
    return c.json({ question: toQuestionResponse({ ...post, tags }, user.id) }, 201)
  })
  .openapi(createAnswerRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')
    const mockPost =
      process.env.MOCK_MODE === 'true' ? MOCK_POSTS.find((item) => item.id === id) : null
    if (process.env.MOCK_MODE === 'true') {
      if (!mockPost) return c.json({ error: '投稿が見つかりません' }, 404)
      if (mockPost.deletedAt)
        return c.json({ error: 'この投稿は削除されたため、回答できません' }, 404)
      if (mockPost.status !== QuestionStatus.OPEN && mockPost.status !== QuestionStatus.ANSWERED)
        return c.json({ error: '回答を受け付けていない質問です' }, 409)
      return c.json(
        {
          answer: toQaAnswerResponse(
            {
              id: `answer-${Date.now()}`,
              postId: id,
              authorId: user.id,
              author: user,
              body: data.body,
              likeCount: 0,
              likes: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            user.id,
            null,
          ),
        },
        201,
      )
    }
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: '投稿が見つかりません' }, 404)
    if (post.deletedAt) return c.json({ error: 'この投稿は削除されたため、回答できません' }, 404)
    if (post.status !== QuestionStatus.OPEN && post.status !== QuestionStatus.ANSWERED)
      return c.json({ error: '回答を受け付けていない質問です' }, 409)
    let assignment: Awaited<ReturnType<typeof getOrAssignAnonymousProfile>>
    try {
      assignment = await getOrAssignAnonymousProfile(id, user.id)
    } catch {
      return c.json({ error: '回答の作成に失敗しました' }, 500)
    }
    // biome-ignore lint/suspicious/noExplicitAny: Prisma result variants share one variable
    let answer: any
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
          include: { author: true, postAnonymousProfile: { include: { anonymousProfile: true } } },
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
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      const existing = await prisma.answer.findUnique({
        where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
        include: { author: true, postAnonymousProfile: { include: { anonymousProfile: true } } },
      })
      if (!existing) return c.json({ error: '回答の作成に失敗しました' }, 500)
      if (existing.body !== data.body)
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      return c.json({ answer: toQaAnswerResponse(existing, user.id, null) }, 200)
    }
    const moderation = await moderateAnswer(answer.body)
    if (moderation?.flagged) {
      try {
        const [, hidden] = await prisma.$transaction([
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
            include: {
              author: true,
              postAnonymousProfile: { include: { anonymousProfile: true } },
            },
          }),
        ])
        answer = hidden
      } catch (error) {
        console.error('Failed to create AI flag', { answerId: answer.id, error })
      }
    }
    return c.json({ answer: toQaAnswerResponse(answer, user.id, null) }, 201)
  })
  .openapi(resolveRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((item) => item.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      return c.json(
        {
          question: toQuestionResponse(
            { ...post, status: QuestionStatus.RESOLVED, resolvedAt: new Date() },
            user.id,
          ),
        },
        200,
      )
    }
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
    if (post.status === QuestionStatus.HIDDEN || post.deletedAt)
      return c.json({ error: '操作できない質問の状態です' }, 409)
    const resolved = await prisma.post.update({
      where: { id },
      data: { status: QuestionStatus.RESOLVED, resolvedAt: new Date() },
      include: questionInclude(user.id),
    })
    return c.json({ question: toQuestionResponse(resolved, user.id) }, 200)
  })
  .openapi(likeRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({ where: { id } })
    if (!post || post.deletedAt) return c.json({ error: 'Not found' }, 404)
    if (post.authorId === user.id) return c.json({ error: '自分の質問にはいいねできません' }, 403)
    if (process.env.MOCK_MODE === 'true')
      return c.json({ liked: true, likeCount: post.likeCount + 1 }, 200)
    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.questionLike.createMany({
        data: [{ postId: id, userId: user.id }],
        skipDuplicates: true,
      })
      const count = await tx.questionLike.count({ where: { postId: id } })
      await tx.post.update({ where: { id }, data: { likeCount: count } })
      return count
    })
    return c.json({ liked: true, likeCount }, 200)
  })
  .openapi(unlikeRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE === 'true')
      return c.json({ liked: false, likeCount: Math.max(0, post.likeCount - 1) }, 200)
    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.questionLike.deleteMany({ where: { postId: id, userId: user.id } })
      const count = await tx.questionLike.count({ where: { postId: id } })
      await tx.post.update({ where: { id }, data: { likeCount: count } })
      return count
    })
    return c.json({ liked: false, likeCount }, 200)
  })
  .openapi(bookmarkRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE !== 'true')
      await prisma.postBookmark.createMany({
        data: [{ postId: id, userId: user.id }],
        skipDuplicates: true,
      })
    return c.json({ saved: true }, 200)
  })
  .openapi(unbookmarkRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE !== 'true')
      await prisma.postBookmark.deleteMany({ where: { postId: id, userId: user.id } })
    return c.json({ saved: false }, 200)
  })
  .openapi(deleteRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') return c.json({ success: true }, 200)
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ success: true }, 200)
    if (user.role !== Role.ADMIN) {
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      if (post.answerCount > 0) return c.json({ error: '回答がある質問は削除できません' }, 409)
    }
    try {
      await prisma.post.delete({ where: { id } })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2025')
        throw error
    }
    return c.json({ success: true }, 200)
  })

const tagsRouteDefinition = createRoute({
  method: 'get',
  path: '/',
  tags: ['question-tags'],
  summary: 'Q&Aで使用するタグ候補を取得',
  ...auth,
  responses: {
    200: {
      description: 'Q&Aタグ',
      content: { 'application/json': { schema: z.object({ tags: z.array(QuestionTagSchema) }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

export const questionTagsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({
  defaultHook,
}).openapi(tagsRouteDefinition, async (c) => {
  if (process.env.MOCK_MODE === 'true')
    return c.json(
      {
        tags: MOCK_TAGS.map(({ id, name }) => ({ id, name })).sort((a, b) =>
          a.name.localeCompare(b.name, 'ja'),
        ),
      },
      200,
    )
  const tags = await prisma.tag.findMany({
    where: { isWorkTag: true },
    select: { id: true, name: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
  return c.json({ tags }, 200)
})

const myQuestionsDefinition = createRoute({
  method: 'get',
  path: '/questions',
  tags: ['users'],
  summary: '自分が投稿した質問を取得',
  ...auth,
  request: { query: PageQuerySchema },
  responses: {
    200: {
      description: '投稿した質問',
      content: { 'application/json': { schema: QuestionListResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})
const savedQuestionsDefinition = createRoute({
  method: 'get',
  path: '/saved-questions',
  tags: ['users'],
  summary: '自分が保存した質問を取得',
  ...auth,
  request: { query: PageQuerySchema },
  responses: {
    200: {
      description: '保存した質問',
      content: { 'application/json': { schema: QuestionListResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

export const meQuestionsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(myQuestionsDefinition, async (c) => {
    const user = c.get('user')
    const { page, pageSize } = c.req.valid('query')
    if (process.env.MOCK_MODE === 'true') {
      const all = mockQuestions(user.id).filter((q) => q.isOwnQuestion)
      return c.json(
        {
          questions: all.slice((page - 1) * pageSize, page * pageSize),
          pagination: pagination(page, pageSize, all.length),
        },
        200,
      )
    }
    const where = { authorId: user.id, deletedAt: null, status: { not: QuestionStatus.HIDDEN } }
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: questionInclude(user.id),
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])
    return c.json(
      {
        questions: posts.map((post) => toQuestionResponse(post, user.id)),
        pagination: pagination(page, pageSize, total),
      },
      200,
    )
  })
  .openapi(savedQuestionsDefinition, async (c) => {
    const user = c.get('user')
    const { page, pageSize } = c.req.valid('query')
    if (process.env.MOCK_MODE === 'true') {
      const all = mockQuestions(user.id)
        .slice(0, 2)
        .map((q) => ({ ...q, saved: true }))
      return c.json(
        {
          questions: all.slice((page - 1) * pageSize, page * pageSize),
          pagination: pagination(page, pageSize, all.length),
        },
        200,
      )
    }
    const where = {
      userId: user.id,
      post: { deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
    }
    const [bookmarks, total] = await Promise.all([
      prisma.postBookmark.findMany({
        where,
        include: { post: { include: questionInclude(user.id) } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.postBookmark.count({ where }),
    ])
    return c.json(
      {
        questions: bookmarks.map((bookmark) => toQuestionResponse(bookmark.post, user.id)),
        pagination: pagination(page, pageSize, total),
      },
      200,
    )
  })
