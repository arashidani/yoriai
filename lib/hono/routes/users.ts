import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createServerClient } from '@supabase/ssr'
import { requireEnv } from '@/lib/env'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, UserSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { createUserSchema } from '@/lib/schemas/user'

const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['users'],
  summary: 'サインアップ直後にPrisma上のUserを作成（Supabaseセッション必須）',
  security: [{ supabaseSession: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: createUserSchema } } },
  },
  responses: {
    201: {
      description: '作成されたユーザー',
      content: { 'application/json': { schema: z.object({ user: UserSchema }) } },
    },
    200: {
      description: '既に存在するユーザー',
      content: { 'application/json': { schema: z.object({ user: UserSchema }) } },
    },
    400: errorResponse('メールアドレスが取得できない、またはリクエストが不正'),
    401: errorResponse('未認証'),
  },
})

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['users'],
  summary: '自分のプロフィールを取得',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      description: '自分のユーザー情報',
      content: { 'application/json': { schema: z.object({ user: UserSchema }) } },
    },
    401: errorResponse('未認証'),
  },
})

export const usersRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  // 登録直後に呼ばれる — Supabaseセッションクッキーからユーザーを特定してPrisma Userを作成
  .openapi(createRoute_, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ user: MOCK_USERS[0] }, 201)
    }

    const supabase = createServerClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          getAll() {
            const cookie = c.req.header('cookie') ?? ''
            return cookie.split(';').flatMap((part) => {
              const [name, ...rest] = part.trim().split('=')
              if (!name) return []
              return [{ name: name.trim(), value: rest.join('=') }]
            })
          },
          setAll() {},
        },
      },
    )

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return c.json({ error: 'Unauthorized' }, 401)

    const { name } = c.req.valid('json')

    const existing = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })
    if (existing) return c.json({ user: existing }, 200)

    if (!authUser.email) {
      return c.json({ error: 'Email not found' }, 400)
    }

    const user = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email,
        name: name ?? authUser.user_metadata?.name ?? null,
      },
    })

    return c.json({ user }, 201)
  })
  // 自分のプロフィール取得
  .openapi(meRoute, async (c) => {
    const user = c.get('user')
    return c.json({ user }, 200)
  })
