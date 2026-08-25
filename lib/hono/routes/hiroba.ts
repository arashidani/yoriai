import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { HirobaPost, User } from '@/app/generated/prisma/client'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagSeverity } from '@/app/generated/prisma/enums'
import { findHiroba, HIROBA_CATALOG } from '@/lib/hiroba/catalog'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  errorResponse,
  HirobaPostSchema,
  HirobaSchema,
  SlugParamSchema,
} from '@/lib/hono/openapi/schemas'
import { MOCK_HIROBA_POSTS, MOCK_HIROBAS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { publicTagSelect } from '@/lib/prisma/selects'
import { createHirobaPostSchema } from '@/lib/schemas/hiroba'

type HirobaPostWithAuthor = HirobaPost & { author: User | null }

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['hiroba'],
  summary: 'ひろば一覧を取得',
  responses: {
    200: {
      description: 'ひろば一覧',
      content: { 'application/json': { schema: z.object({ hirobas: z.array(HirobaSchema) }) } },
    },
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/{slug}',
  tags: ['hiroba'],
  summary: 'ひろば詳細と投稿一覧を取得',
  request: { params: SlugParamSchema },
  responses: {
    200: {
      description: 'ひろば詳細',
      content: {
        'application/json': {
          schema: z.object({ hiroba: HirobaSchema, posts: z.array(HirobaPostSchema) }),
        },
      },
    },
    404: errorResponse('ひろばが見つからない', 'Not found'),
  },
})

const membershipResponse = z.object({ joined: z.boolean() })

const joinRoute = createRoute({
  method: 'post',
  path: '/{slug}/membership',
  tags: ['hiroba'],
  summary: 'ひろばに参加する',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: SlugParamSchema },
  responses: {
    200: {
      description: '参加後の状態',
      content: { 'application/json': { schema: membershipResponse } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('ひろばが見つからない', 'Not found'),
  },
})

const leaveRoute = createRoute({
  method: 'delete',
  path: '/{slug}/membership',
  tags: ['hiroba'],
  summary: 'ひろばから退出する',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: SlugParamSchema },
  responses: {
    200: {
      description: '退出後の状態',
      content: { 'application/json': { schema: membershipResponse } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('ひろばが見つからない', 'Not found'),
  },
})

const createPostRoute = createRoute({
  method: 'post',
  path: '/{slug}/posts',
  tags: ['hiroba'],
  summary: 'ひろばに投稿を作成',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: SlugParamSchema,
    headers: z.object({
      'idempotency-key': z.string().uuid().openapi({
        description: '通信失敗後に同じ投稿を再送しても、重複作成しないためのUUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    }),
    body: { required: true, content: { 'application/json': { schema: createHirobaPostSchema } } },
  },
  responses: {
    201: {
      description: '作成された投稿',
      content: { 'application/json': { schema: z.object({ post: HirobaPostSchema }) } },
    },
    200: {
      description: '再送された投稿（すでに作成済みの投稿）',
      content: { 'application/json': { schema: z.object({ post: HirobaPostSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('ひろばが見つからない', 'Not found'),
    409: errorResponse(
      '同じキーで、前回とは異なる投稿内容が送信された',
      '同じ投稿操作に異なる内容が指定されています',
    ),
    500: errorResponse('投稿の作成に失敗した', '投稿の作成に失敗しました'),
  },
})

export const hirobaRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ hirobas: MOCK_HIROBAS }, 200)
    }
    const hirobas = await prisma.hiroba.findMany({
      where: { slug: { in: HIROBA_CATALOG.map((hiroba) => hiroba.slug) } },
    })
    const bySlug = new Map(hirobas.map((hiroba) => [hiroba.slug, hiroba]))
    return c.json(
      { hirobas: HIROBA_CATALOG.flatMap((hiroba) => bySlug.get(hiroba.slug) ?? []) },
      200,
    )
  })
  .openapi(getRoute, async (c) => {
    const { slug } = c.req.valid('param')
    if (!findHiroba(slug)) return c.json({ error: 'Not found' }, 404)

    if (process.env.MOCK_MODE === 'true') {
      const hiroba = MOCK_HIROBAS.find((h) => h.slug === slug)
      if (!hiroba) return c.json({ error: 'Not found' }, 404)
      const posts = MOCK_HIROBA_POSTS.filter((p) => p.hirobaId === hiroba.id)
      return c.json({ hiroba, posts }, 200)
    }

    const hiroba = await prisma.hiroba.findUnique({ where: { slug } })
    if (!hiroba) return c.json({ error: 'Not found' }, 404)

    const posts = await prisma.hirobaPost.findMany({
      where: { hirobaId: hiroba.id, deletedAt: null },
      include: { author: true, tags: { include: { tag: { select: publicTagSelect } } } },
      orderBy: { updatedAt: 'desc' },
    })
    return c.json(
      { hiroba, posts: posts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag) })) },
      200,
    )
  })
  .openapi(joinRoute, async (c) => {
    const { slug } = c.req.valid('param')
    if (!findHiroba(slug)) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE === 'true') return c.json({ joined: true }, 200)

    const hiroba = await prisma.hiroba.findUnique({ where: { slug }, select: { id: true } })
    if (!hiroba) return c.json({ error: 'Not found' }, 404)

    const user = c.get('user')
    await prisma.hirobaMembership.upsert({
      where: { userId_hirobaId: { userId: user.id, hirobaId: hiroba.id } },
      update: {},
      create: { userId: user.id, hirobaId: hiroba.id },
    })
    return c.json({ joined: true }, 200)
  })
  .openapi(leaveRoute, async (c) => {
    const { slug } = c.req.valid('param')
    if (!findHiroba(slug)) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE === 'true') return c.json({ joined: false }, 200)

    const hiroba = await prisma.hiroba.findUnique({ where: { slug }, select: { id: true } })
    if (!hiroba) return c.json({ error: 'Not found' }, 404)

    const user = c.get('user')
    await prisma.hirobaMembership.deleteMany({ where: { userId: user.id, hirobaId: hiroba.id } })
    return c.json({ joined: false }, 200)
  })
  .openapi(createPostRoute, async (c) => {
    const { slug } = c.req.valid('param')
    if (!findHiroba(slug)) return c.json({ error: 'Not found' }, 404)

    if (process.env.MOCK_MODE === 'true') {
      const hiroba = MOCK_HIROBAS.find((h) => h.slug === slug)
      if (!hiroba) return c.json({ error: 'Not found' }, 404)
      const user = c.get('user')
      const data = c.req.valid('json')
      return c.json(
        {
          post: {
            id: `hiroba-post-${Date.now()}`,
            hirobaId: hiroba.id,
            ...data,
            imageUrl: null,
            authorId: user.id,
            author: user,
            answerCount: 0,
            likeCount: 0,
            deletedAt: null,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        201,
      )
    }

    const hiroba = await prisma.hiroba.findUnique({ where: { slug } })
    if (!hiroba) return c.json({ error: 'Not found' }, 404)

    const user = c.get('user')
    const data = c.req.valid('json')
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')

    let post: HirobaPostWithAuthor
    try {
      post = await prisma.hirobaPost.create({
        data: { ...data, hirobaId: hiroba.id, authorId: user.id, idempotencyKey },
        include: { author: true },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        return c.json({ error: '投稿の作成に失敗しました' }, 500)
      }

      let existingPost: HirobaPostWithAuthor | null
      try {
        existingPost = await prisma.hirobaPost.findUnique({
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

      return c.json({ post: { ...existingPost, tags: [] } }, 200)
    }

    const { moderatePost } = await import('@/lib/ai/moderate-post')
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
              hirobaPostId: post.id,
            },
          }),
          prisma.hirobaPost.update({
            where: { id: post.id },
            data: { deletedAt: new Date() },
            include: { author: true },
          }),
        ])
        post = flaggedPost
      } catch (error) {
        console.error('Failed to create AI flag', { hirobaPostId: post.id, error })
      }
    }

    let tags: { id: string; name: string; createdAt: Date }[] = []
    if (!post.deletedAt) {
      try {
        const allTags = await prisma.tag.findMany({
          select: { id: true, name: true, category: true, description: true, createdAt: true },
        })
        const { assignTags } = await import('@/lib/ai/assign-tags')
        const selectedNames = await assignTags(post.title, post.body, allTags)
        const selectedTags = allTags.filter((t) => selectedNames.includes(t.name)).slice(0, 1)
        if (selectedTags.length > 0) {
          await prisma.hirobaPostTag.createMany({
            data: selectedTags.map((t) => ({ hirobaPostId: post.id, tagId: t.id })),
          })
          tags = selectedTags.map(({ id, name, createdAt }) => ({ id, name, createdAt }))
        }
      } catch (error) {
        console.error('Failed to assign tags', { hirobaPostId: post.id, error })
      }
    }

    return c.json({ post: { ...post, tags } }, 201)
  })
