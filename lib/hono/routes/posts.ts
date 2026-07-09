import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware, type AuthVariables } from '@/lib/hono/middleware/auth'
import { createPostSchema } from '@/lib/schemas/post'
import {
  PostSchema,
  SuccessSchema,
  IdParamSchema,
  errorResponse,
} from '@/lib/hono/openapi/schemas'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@/app/generated/prisma/enums'

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
    404: errorResponse('投稿が見つからない'),
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
    body: { required: true, content: { 'application/json': { schema: createPostSchema } } },
  },
  responses: {
    201: {
      description: '作成された投稿',
      content: { 'application/json': { schema: z.object({ post: PostSchema }) } },
    },
    401: errorResponse('未認証'),
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
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
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
    const user = c.get('user')
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
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
        201
      )
    }
    const post = await prisma.post.create({
      data: { ...data, authorId: user.id },
      include: { author: true },
    })
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
