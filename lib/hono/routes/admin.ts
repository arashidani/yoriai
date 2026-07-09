import { OpenAPIHono, createRoute, z, $ } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import { authMiddleware, type AuthVariables } from '@/lib/hono/middleware/auth'
import { updateUserSchema } from '@/lib/schemas/user'
import {
  UserSchema,
  PostSchema,
  SuccessSchema,
  IdParamSchema,
  errorResponse,
} from '@/lib/hono/openapi/schemas'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { MOCK_POSTS, MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@/app/generated/prisma/enums'

const adminGuard = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (c.get('user').role !== Role.ADMIN) return c.json({ error: 'Forbidden' }, 403)
  return next()
})

const security = [{ supabaseSession: [] }]

const listUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  tags: ['admin'],
  summary: 'ユーザー一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'ユーザー一覧',
      content: { 'application/json': { schema: z.object({ users: z.array(UserSchema) }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const listPostsRoute = createRoute({
  method: 'get',
  path: '/posts',
  tags: ['admin'],
  summary: '投稿一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: '投稿一覧',
      content: { 'application/json': { schema: z.object({ posts: z.array(PostSchema) }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const patchUserRoute = createRoute({
  method: 'patch',
  path: '/users/{id}',
  tags: ['admin'],
  summary: 'ユーザーの名前・ロールを更新（管理者専用、自分自身のロール変更は不可）',
  security,
  request: {
    params: IdParamSchema,
    body: { required: true, content: { 'application/json': { schema: updateUserSchema } } },
  },
  responses: {
    200: {
      description: '更新後のユーザー',
      content: { 'application/json': { schema: z.object({ user: UserSchema }) } },
    },
    400: errorResponse('自分自身のロールは変更できないなど'),
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{id}',
  tags: ['admin'],
  summary: 'ユーザーを削除（管理者専用、自分自身は削除不可）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    400: errorResponse('自分自身は削除できない'),
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

export const adminRoute = $(
  new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
    .use(authMiddleware)
    .use(adminGuard)
)
  .openapi(listUsersRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ users: MOCK_USERS }, 200)
    }
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json({ users }, 200)
  })
  .openapi(listPostsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ posts: MOCK_POSTS }, 200)
    }
    const posts = await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ posts }, 200)
  })
  .openapi(patchUserRoute, async (c) => {
    const currentUser = c.get('user')
    const { id: targetId } = c.req.valid('param')
    const { name, role } = c.req.valid('json')

    if (targetId === currentUser.id && role !== undefined) {
      return c.json({ error: '自分自身のロールは変更できません' }, 400)
    }

    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          user: {
            ...MOCK_USERS[0],
            id: targetId,
            name: name ?? MOCK_USERS[0].name,
            role: role ?? MOCK_USERS[0].role,
          },
        },
        200
      )
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { ...(name !== undefined && { name }), ...(role !== undefined && { role }) },
    })
    return c.json({ user }, 200)
  })
  .openapi(deleteUserRoute, async (c) => {
    const currentUser = c.get('user')
    const { id: targetId } = c.req.valid('param')

    if (targetId === currentUser.id) {
      return c.json({ error: '自分自身は削除できません' }, 400)
    }

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    await prisma.user.delete({ where: { id: targetId } })
    return c.json({ success: true }, 200)
  })
