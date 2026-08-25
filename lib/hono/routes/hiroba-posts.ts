import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import type { HirobaAnswer, User } from '@/app/generated/prisma/client'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagSeverity, NotificationType, Role } from '@/app/generated/prisma/enums'
import { moderateAnswer } from '@/lib/ai/moderate-post'
import { scheduleAfterResponse } from '@/lib/hono/after-response'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  errorResponse,
  HirobaAnswerSchema,
  HirobaPostSchema,
  IdParamSchema,
  LikeStatusSchema,
  SavedStatusSchema,
  SuccessSchema,
} from '@/lib/hono/openapi/schemas'
import {
  HIROBA_POST_IMAGE_MAX_BYTES,
  HIROBA_POST_IMAGE_TOO_LARGE_MESSAGE,
} from '@/lib/image/hiroba-post-image-limits'
import {
  HirobaPostImageProcessingError,
  processHirobaPostImage,
  UnsupportedHirobaPostImageError,
} from '@/lib/image/process-hiroba-post-image'
import { MOCK_HIROBA_ANSWERS, MOCK_HIROBA_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { publicTagSelect } from '@/lib/prisma/selects'
import { createHirobaAnswerSchema } from '@/lib/schemas/hiroba'
import {
  HirobaPostImageUploadError,
  uploadHirobaPostImage,
} from '@/lib/supabase/storage/hiroba-post-image'

type HirobaAnswerWithAuthor = HirobaAnswer & { author: User | null }

function toAnswerResponse(answer: HirobaAnswerWithAuthor) {
  return {
    id: answer.id,
    hirobaPostId: answer.hirobaPostId,
    body: answer.body,
    authorId: answer.authorId,
    author: answer.author,
    isHidden: answer.isHidden,
    likeCount: answer.likeCount,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['hiroba-posts'],
  summary: 'ひろば投稿を1件取得',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '投稿詳細',
      content: { 'application/json': { schema: z.object({ post: HirobaPostSchema }) } },
    },
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const listAnswersRoute = createRoute({
  method: 'get',
  path: '/{id}/answers',
  tags: ['hiroba-posts'],
  summary: '投稿への回答一覧を取得（いいね数の多い順、同数なら投稿順）',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '回答一覧',
      content: {
        'application/json': { schema: z.object({ answers: z.array(HirobaAnswerSchema) }) },
      },
    },
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const createAnswerRoute = createRoute({
  method: 'post',
  path: '/{id}/answers',
  tags: ['hiroba-posts'],
  summary: '投稿に回答を投稿',
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
    body: {
      required: true,
      content: { 'application/json': { schema: createHirobaAnswerSchema } },
    },
  },
  responses: {
    201: {
      description: '作成された回答',
      content: { 'application/json': { schema: z.object({ answer: HirobaAnswerSchema }) } },
    },
    200: {
      description: '再送された回答（すでに作成済みの回答）',
      content: { 'application/json': { schema: z.object({ answer: HirobaAnswerSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('投稿が見つからない', 'Not found'),
    409: errorResponse(
      '同じキーで、前回とは異なる回答内容が送信された',
      '同じ投稿操作に異なる内容が指定されています',
    ),
    500: errorResponse('回答の作成に失敗した', '回答の作成に失敗しました'),
  },
})

const likeRoute = createRoute({
  method: 'post',
  path: '/{id}/likes',
  tags: ['hiroba-posts'],
  summary: '投稿にいいねする',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'いいね後の状態',
      content: { 'application/json': { schema: LikeStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('自分の投稿にはいいねできない', '自分の投稿にはいいねできません'),
    404: errorResponse('投稿が見つからない', 'Not found'),
    500: errorResponse('いいねの処理に失敗した', 'いいねの処理に失敗しました'),
  },
})

const unlikeRoute = createRoute({
  method: 'delete',
  path: '/{id}/likes',
  tags: ['hiroba-posts'],
  summary: '投稿へのいいねを取り消す',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'いいね取り消し後の状態',
      content: { 'application/json': { schema: LikeStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('投稿が見つからない', 'Not found'),
    500: errorResponse('いいね取り消しの処理に失敗した', 'いいね取り消しの処理に失敗しました'),
  },
})

const bookmarkRoute = createRoute({
  method: 'post',
  path: '/{id}/bookmarks',
  tags: ['hiroba-posts'],
  summary: '投稿を保存する',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存後の状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('投稿が見つからない', 'Not found'),
    500: errorResponse('保存の処理に失敗した', '保存の処理に失敗しました'),
  },
})

const unbookmarkRoute = createRoute({
  method: 'delete',
  path: '/{id}/bookmarks',
  tags: ['hiroba-posts'],
  summary: '投稿の保存を取り消す',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存取り消し後の状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('投稿が見つからない', 'Not found'),
    500: errorResponse('保存取り消しの処理に失敗した', '保存取り消しの処理に失敗しました'),
  },
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['hiroba-posts'],
  summary: '投稿を削除（管理者、または回答が付く前の投稿者本人）',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者・投稿者本人以外）', 'Forbidden'),
    409: errorResponse(
      '回答が付いている投稿は投稿者本人には削除できない',
      '回答がある投稿は削除できません',
    ),
  },
})

const uploadImageRoute = createRoute({
  method: 'put',
  path: '/{id}/image',
  tags: ['hiroba-posts'],
  summary: 'ひろば投稿の画像をアップロード',
  security: [{ supabaseSession: [] }],
  middleware: [
    authMiddleware,
    bodyLimit({
      maxSize: HIROBA_POST_IMAGE_MAX_BYTES,
      onError: (c) => c.json({ error: HIROBA_POST_IMAGE_TOO_LARGE_MESSAGE }, 413),
    }),
  ] as const,
  request: {
    params: IdParamSchema,
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({ type: 'string', format: 'binary' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '画像を設定した投稿',
      content: { 'application/json': { schema: z.object({ post: HirobaPostSchema }) } },
    },
    400: errorResponse('対応していない画像形式', '対応していない画像形式です'),
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('投稿者本人ではない', 'Forbidden'),
    404: errorResponse('投稿が見つからない', 'Not found'),
    413: errorResponse('ファイルサイズ超過', HIROBA_POST_IMAGE_TOO_LARGE_MESSAGE),
    422: errorResponse('画像処理に失敗', '画像を処理できませんでした'),
    502: errorResponse('アップロード失敗', '画像のアップロードに失敗しました'),
  },
})

export const hirobaPostsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(getRoute, async (c) => {
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ post }, 200)
    }
    const post = await prisma.hirobaPost.findFirst({
      where: { id, deletedAt: null },
      include: { author: true, tags: { include: { tag: { select: publicTagSelect } } } },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    return c.json({ post: { ...post, tags: post.tags.map((pt) => pt.tag) } }, 200)
  })
  .openapi(listAnswersRoute, async (c) => {
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_HIROBA_ANSWERS.filter((a) => a.hirobaPostId === id)
      return c.json({ answers }, 200)
    }

    const post = await prisma.hirobaPost.findFirst({ where: { id, deletedAt: null } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    const answers = await prisma.hirobaAnswer.findMany({
      where: { hirobaPostId: id, isHidden: false },
      include: { author: true },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
    })
    return c.json({ answers: answers.map(toAnswerResponse) }, 200)
  })
  .openapi(uploadImageRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')
    const { file } = c.req.valid('form')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((item) => item.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      return c.json(
        { post: { ...post, imageUrl: 'https://storage.example.com/hiroba-posts/mock.webp' } },
        200,
      )
    }

    const post = await prisma.hirobaPost.findFirst({
      where: { id, authorId: user.id, deletedAt: null },
    })
    if (!post) {
      const exists = await prisma.hirobaPost.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      })
      return c.json({ error: exists ? 'Forbidden' : 'Not found' }, exists ? 403 : 404)
    }

    let image: Buffer
    try {
      image = await processHirobaPostImage(Buffer.from(await file.arrayBuffer()))
    } catch (error) {
      if (error instanceof UnsupportedHirobaPostImageError)
        return c.json({ error: error.message }, 400)
      if (error instanceof HirobaPostImageProcessingError)
        return c.json({ error: error.message }, 422)
      throw error
    }

    let imageUrl: string
    try {
      imageUrl = await uploadHirobaPostImage(post.id, image)
    } catch (error) {
      if (error instanceof HirobaPostImageUploadError) {
        return c.json({ error: '画像のアップロードに失敗しました' }, 502)
      }
      throw error
    }

    const updated = await prisma.hirobaPost.update({ where: { id: post.id }, data: { imageUrl } })
    return c.json({ post: { ...updated, tags: [] } }, 200)
  })
  .openapi(createAnswerRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const user = c.get('user')
      const data = c.req.valid('json')
      return c.json(
        {
          answer: {
            id: `hiroba-answer-${Date.now()}`,
            hirobaPostId: id,
            body: data.body,
            authorId: user.id,
            author: user,
            isHidden: false,
            likeCount: 0,
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

    const post = await prisma.hirobaPost.findFirst({ where: { id, deletedAt: null } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    let answer: HirobaAnswerWithAuthor
    try {
      answer = await prisma.$transaction(async (tx) => {
        const created = await tx.hirobaAnswer.create({
          data: { hirobaPostId: id, authorId: user.id, body: data.body, idempotencyKey },
          include: { author: true },
        })
        await tx.hirobaPost.update({ where: { id }, data: { answerCount: { increment: 1 } } })
        return created
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        console.error('Failed to create hiroba answer', { hirobaPostId: id, error })
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      }

      let existingAnswer: HirobaAnswerWithAuthor | null
      try {
        existingAnswer = await prisma.hirobaAnswer.findUnique({
          where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
          include: { author: true },
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
              hirobaAnswerId: answer.id,
            },
          }),
          prisma.hirobaAnswer.update({
            where: { id: answer.id },
            data: { isHidden: true, hiddenAt: new Date(), hiddenReason: 'AIによる自動検出' },
            include: { author: true },
          }),
        ])
        answer = hiddenAnswer
      } catch (error) {
        console.error('Failed to create AI flag', { hirobaAnswerId: answer.id, error })
      }
    }

    if (!answer.isHidden && post.authorId && post.authorId !== user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: NotificationType.HIROBA_POST_ANSWERED,
            hirobaPostId: post.id,
            hirobaAnswerId: answer.id,
          },
        })
      } catch (error) {
        console.error('Failed to create hiroba reply notification', { postId: post.id, error })
      }
    }

    return c.json({ answer: toAnswerResponse(answer) }, 201)
  })
  .openapi(likeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId === user.id) return c.json({ error: '自分の投稿にはいいねできません' }, 403)
      return c.json({ liked: true, likeCount: post.likeCount + 1 }, 200)
    }

    const post = await prisma.hirobaPost.findUnique({
      where: { id },
      select: { id: true, authorId: true, likeCount: true },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.authorId === user.id) return c.json({ error: '自分の投稿にはいいねできません' }, 403)

    const { likeCount, isNewLike } = await prisma.$transaction(async (tx) => {
      const created = await tx.hirobaPostLike.createMany({
        data: [{ hirobaPostId: id, userId: user.id }],
        skipDuplicates: true,
      })
      if (created.count === 0) return { likeCount: post.likeCount, isNewLike: false }

      const updatedPost = await tx.hirobaPost.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      })
      return { likeCount: updatedPost.likeCount, isNewLike: true }
    })

    if (isNewLike && post.authorId) {
      const authorId = post.authorId
      scheduleAfterResponse(async () => {
        try {
          await prisma.notification.create({
            data: {
              userId: authorId,
              type: NotificationType.HIROBA_POST_LIKED,
              hirobaPostId: id,
            },
          })
        } catch (error) {
          console.error('Failed to create hiroba post like notification', {
            hirobaPostId: id,
            error,
          })
        }
      })
    }

    return c.json({ liked: true, likeCount }, 200)
  })
  .openapi(unlikeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ liked: false, likeCount: Math.max(0, post.likeCount - 1) }, 200)
    }

    const post = await prisma.hirobaPost.findUnique({
      where: { id },
      select: { id: true, authorId: true, likeCount: true },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)

    const likeCount = await prisma.$transaction(async (tx) => {
      const deleted = await tx.hirobaPostLike.deleteMany({
        where: { hirobaPostId: id, userId: user.id },
      })
      if (deleted.count === 0) return post.likeCount

      const updatedPost = await tx.hirobaPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      })
      return updatedPost.likeCount
    })
    return c.json({ liked: false, likeCount }, 200)
  })
  .openapi(bookmarkRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ saved: true }, 200)
    }

    const post = await prisma.hirobaPost.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    try {
      await prisma.hirobaPostBookmark.create({ data: { hirobaPostId: id, userId: user.id } })
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
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ saved: false }, 200)
    }

    const post = await prisma.hirobaPost.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)

    await prisma.hirobaPostBookmark.deleteMany({ where: { hirobaPostId: id, userId: user.id } })
    return c.json({ saved: false }, 200)
  })
  .openapi(deleteRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const post = await prisma.hirobaPost.findUnique({ where: { id } })
    if (!post) return c.json({ success: true }, 200)

    if (user.role !== Role.ADMIN) {
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      if (post.answerCount > 0) return c.json({ error: '回答がある投稿は削除できません' }, 409)
    }

    try {
      await prisma.hirobaPost.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return c.json({ success: true }, 200)
      }
      throw error
    }
    return c.json({ success: true }, 200)
  })
