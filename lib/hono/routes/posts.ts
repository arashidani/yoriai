import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { type Post, Prisma, type User } from '@/app/generated/prisma/client'
import { FlagSeverity, Role } from '@/app/generated/prisma/enums'
import { moderatePost } from '@/lib/ai/moderate-post'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, IdParamSchema, PostSchema, SuccessSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { createPostSchema } from '@/lib/schemas/post'

type PostWithAuthor = Post & { author: User | null }

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

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['posts'],
  summary: '投稿を削除（管理者のみ）',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

export const postsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ posts: MOCK_POSTS }, 200)
    }
    const posts = await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
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
    const post = await prisma.post.findUnique({
      where: { id },
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

    const moderation = await moderatePost(post.title, post.body)
    if (moderation?.flagged) {
      try {
        await prisma.aiFlag.create({
          data: {
            title: `不適切な投稿の可能性: ${post.title}`,
            detail: moderation.reason,
            severity: FlagSeverity[moderation.severity],
            targetUserId: user.id,
            postId: post.id,
          },
        })
      } catch (error) {
        console.error('Failed to create AI flag', { postId: post.id, error })
      }
    }

    return c.json({ post }, 201)
  })
  .openapi(deleteRoute, async (c) => {
    const user = c.get('user')
    if (user.role !== Role.ADMIN) return c.json({ error: 'Forbidden' }, 403)

    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }
    await prisma.post.delete({ where: { id } })
    return c.json({ success: true }, 200)
  })
