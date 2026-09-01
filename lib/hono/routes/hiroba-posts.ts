import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagSeverity, NotificationType, Role } from '@/app/generated/prisma/enums'
import { HIROBA_CATALOG, isDefaultHiroba } from '@/lib/hiroba/catalog'
import {
  hirobaAnswerInclude,
  hirobaPostInclude,
  mapHirobaPostResponse,
  toHirobaAnswerResponse,
  type HirobaAnswerWithPublicAuthor,
  toPublicPostAuthor,
} from '@/lib/hiroba/api-response'
import { scheduleAfterResponse } from '@/lib/hono/after-response'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  errorResponse,
  HirobaAnswerSchema,
  HirobaPostSchema,
  IdParamSchema,
  LikeStatusSchema,
  MentionCandidateSchema,
  SavedStatusSchema,
  SuccessSchema,
} from '@/lib/hono/openapi/schemas'
import {
  HIROBA_POST_IMAGE_MAX_BYTES,
  HIROBA_POST_IMAGE_TOO_LARGE_MESSAGE,
} from '@/lib/image/hiroba-post-image-limits'
import { hasBodyMention } from '@/lib/mentions/has-body-mention'
import {
  MOCK_HIROBA_ANSWERS,
  MOCK_HIROBA_POSTS,
  MOCK_HIROBAS,
  MOCK_JOINED_HIROBA_SLUGS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { createHirobaAnswerSchema } from '@/lib/schemas/hiroba'
import {
  HirobaPostImageUploadError,
  uploadHirobaPostImage,
} from '@/lib/supabase/storage/hiroba-post-image'

const auth = {
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
}

async function getHirobaMentionCandidates(postId: string, viewerId: string) {
  if (process.env.MOCK_MODE === 'true') {
    const post = MOCK_HIROBA_POSTS.find((item) => item.id === postId)
    if (!post) return null
    const participants = [
      ...MOCK_HIROBA_ANSWERS.filter(
        (answer) => answer.hirobaPostId === postId && !answer.isHidden,
      ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      post,
    ]
    const seen = new Set<string>()
    return participants.flatMap((participant) => {
      if (
        !participant.authorId ||
        participant.authorId === viewerId ||
        !participant.author ||
        seen.has(participant.authorId)
      )
        return []
      seen.add(participant.authorId)
      return [
        {
          id: participant.authorId,
          displayName: participant.author.username ?? participant.author.name ?? 'ユーザー',
        },
      ]
    })
  }

  const post = await prisma.hirobaPost.findFirst({
    where: { id: postId, deletedAt: null },
    select: {
      authorId: true,
      author: { select: { name: true, username: true } },
      answers: {
        where: { isHidden: false, authorId: { not: null } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          authorId: true,
          author: { select: { name: true, username: true } },
        },
      },
    },
  })
  if (!post) return null

  const seen = new Set<string>()
  const add = (
    userId: string | null,
    author: { name: string | null; username: string | null } | null,
  ) => {
    if (!userId || userId === viewerId || !author || seen.has(userId)) return []
    seen.add(userId)
    return [{ id: userId, displayName: author.username ?? author.name ?? 'ユーザー' }]
  }
  return [
    ...post.answers.flatMap((answer) => add(answer.authorId, answer.author)),
    ...add(post.authorId, post.author),
  ]
}

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['hiroba-posts'],
  summary: 'ひろば投稿を1件取得',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '投稿詳細',
      content: { 'application/json': { schema: z.object({ post: HirobaPostSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const listAnswersRoute = createRoute({
  method: 'get',
  path: '/{id}/answers',
  tags: ['hiroba-posts'],
  summary: '投稿への回答一覧を取得（いいね数の多い順、同数なら投稿順）',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '回答一覧',
      content: {
        'application/json': { schema: z.object({ answers: z.array(HirobaAnswerSchema) }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const mentionCandidatesRoute = createRoute({
  method: 'get',
  path: '/{id}/mention-candidates',
  tags: ['hiroba-posts'],
  summary: 'ひろば投稿でメンションできる参加者を最新の回答順で取得',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'メンション候補',
      content: {
        'application/json': { schema: z.object({ candidates: z.array(MentionCandidateSchema) }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
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
    403: errorResponse('ひろばに未参加', 'ひろばに参加してください'),
    400: errorResponse('メンション対象が不正', 'このスレッドの参加者のみメンションできます'),
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
  .openapi(mentionCandidatesRoute, async (c) => {
    const { id } = c.req.valid('param')
    const candidates = await getHirobaMentionCandidates(id, c.get('user').id)
    if (!candidates) return c.json({ error: 'Not found' }, 404)
    return c.json({ candidates }, 200)
  })
  .openapi(getRoute, async (c) => {
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ post: { ...post, author: toPublicPostAuthor(post.author) } }, 200)
    }
    const post = await prisma.hirobaPost.findFirst({
      where: { id, deletedAt: null },
      include: hirobaPostInclude,
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    return c.json({ post: mapHirobaPostResponse(post) }, 200)
  })
  .openapi(listAnswersRoute, async (c) => {
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_HIROBA_ANSWERS.filter((a) => a.hirobaPostId === id).map((answer) =>
        toHirobaAnswerResponse({ ...answer, author: toPublicPostAuthor(answer.author) }),
      )
      return c.json({ answers }, 200)
    }

    const post = await prisma.hirobaPost.findFirst({ where: { id, deletedAt: null } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    const answers = await prisma.hirobaAnswer.findMany({
      where: { hirobaPostId: id, isHidden: false },
      include: hirobaAnswerInclude,
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
    })
    return c.json({ answers: answers.map(toHirobaAnswerResponse) }, 200)
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
      const { processHirobaPostImage } = await import('@/lib/image/process-hiroba-post-image')
      image = await processHirobaPostImage(Buffer.from(await file.arrayBuffer()))
    } catch (error) {
      const { HirobaPostImageProcessingError, UnsupportedHirobaPostImageError } = await import(
        '@/lib/image/process-hiroba-post-image'
      )
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
      const hirobaSlug = MOCK_HIROBAS.find((hiroba) => hiroba.id === post.hirobaId)?.slug
      if (
        !hirobaSlug ||
        (!isDefaultHiroba(hirobaSlug) &&
          !MOCK_JOINED_HIROBA_SLUGS.includes(
            hirobaSlug as (typeof MOCK_JOINED_HIROBA_SLUGS)[number],
          ))
      )
        return c.json({ error: 'ひろばに参加してください' }, 403)
      const user = c.get('user')
      const data = c.req.valid('json')
      return c.json(
        {
          answer: {
            id: `hiroba-answer-${Date.now()}`,
            hirobaPostId: id,
            body: data.body,
            authorId: user.id,
            author: toPublicPostAuthor(user),
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
    const hirobaSlug = HIROBA_CATALOG.find((hiroba) => hiroba.id === post.hirobaId)?.slug
    if (
      !hirobaSlug ||
      (!isDefaultHiroba(hirobaSlug) &&
        !(await prisma.hirobaMembership.findUnique({
          where: { userId_hirobaId: { userId: user.id, hirobaId: post.hirobaId } },
          select: { userId: true },
        })))
    )
      return c.json({ error: 'ひろばに参加してください' }, 403)
    const requestedMentionIds = data.mentionedUserIds ?? []
    if (requestedMentionIds.length > 0) {
      const candidates = await getHirobaMentionCandidates(id, user.id)
      if (
        !candidates ||
        !requestedMentionIds.every((userId) => candidates.some((item) => item.id === userId))
      )
        return c.json({ error: 'このスレッドの参加者のみメンションできます' }, 400)
      const displayNameByUserId = new Map(
        candidates.map((candidate) => [candidate.id, candidate.displayName] as const),
      )
      if (
        !requestedMentionIds.every((userId) =>
          hasBodyMention(data.body, displayNameByUserId.get(userId) ?? ''),
        )
      )
        return c.json({ error: '本文内のメンションを指定してください' }, 400)
    }

    let answer: HirobaAnswerWithPublicAuthor
    try {
      answer = await prisma.$transaction(async (tx) => {
        const created = await tx.hirobaAnswer.create({
          data: { hirobaPostId: id, authorId: user.id, body: data.body, idempotencyKey },
          include: hirobaAnswerInclude,
        })
        await tx.hirobaPost.update({ where: { id }, data: { answerCount: { increment: 1 } } })
        return created
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        console.error('Failed to create hiroba answer', { hirobaPostId: id, error })
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      }

      let existingAnswer: HirobaAnswerWithPublicAuthor | null
      try {
        existingAnswer = await prisma.hirobaAnswer.findUnique({
          where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
          include: hirobaAnswerInclude,
        })
      } catch {
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      }

      if (!existingAnswer) return c.json({ error: '回答の作成に失敗しました' }, 500)
      if (existingAnswer.body !== data.body) {
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      }

      return c.json({ answer: toHirobaAnswerResponse(existingAnswer) }, 200)
    }

    const { moderateAnswer } = await import('@/lib/ai/moderate-post')
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
            include: hirobaAnswerInclude,
          }),
          prisma.hirobaPost.update({
            where: { id: answer.hirobaPostId },
            data: { answerCount: { decrement: 1 } },
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

    if (!answer.isHidden) {
      const mentionedUserIds = [...new Set(requestedMentionIds)].filter((id) => id !== user.id)
      if (mentionedUserIds.length > 0) {
        try {
          await prisma.notification.createMany({
            data: mentionedUserIds.map((userId) => ({
              userId,
              type: NotificationType.MENTIONED,
              hirobaPostId: post.id,
              hirobaAnswerId: answer.id,
            })),
          })
        } catch (error) {
          console.error('Failed to create hiroba mention notifications', { postId: post.id, error })
        }
      }
    }

    return c.json({ answer: toHirobaAnswerResponse(answer) }, 201)
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
