import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createServerClient } from '@supabase/ssr'
import { requireEnv } from '@/lib/env'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, UserSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_INVITES, MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { createUserSchema } from '@/lib/schemas/user'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['users'],
  summary: 'サインアップ直後にPrisma上のUserを作成（招待リンク必須、Supabaseセッション必須）',
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
    400: errorResponse(
      '招待リンクが無効・期限切れ、またはメールアドレスが取得できない',
      '招待リンクが無効です',
    ),
    401: errorResponse('未認証', 'Unauthorized'),
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
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

export const usersRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  // 登録直後に呼ばれる — Supabaseセッションクッキーからユーザーを特定してPrisma Userを作成
  .openapi(createRoute_, async (c) => {
    const { name, inviteToken } = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      const invite = MOCK_INVITES.find((i) => i.token === inviteToken)
      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        return c.json({ error: '招待リンクが無効です' }, 400)
      }
      return c.json({ user: { ...MOCK_USERS[0], role: invite.role } }, 201)
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

    const existing = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })
    if (existing) return c.json({ user: existing }, 200)

    if (!authUser.email) {
      return c.json({ error: 'Email not found' }, 400)
    }

    const now = new Date()

    const user = await prisma.$transaction(async (tx) => {
      // usedAt/expiresAtを条件にした原子的な確保。同一トークンの並行リクエストでも1件しか成功しない
      const claimed = await tx.invite.updateMany({
        where: { token: inviteToken, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (claimed.count !== 1) return null

      const invite = await tx.invite.findUniqueOrThrow({ where: { token: inviteToken } })

      return tx.user.create({
        data: {
          supabaseId: authUser.id,
          email: authUser.email as string,
          name: name ?? invite.name ?? authUser.user_metadata?.name ?? null,
          role: invite.role,
        },
      })
    })

    if (!user) {
      return c.json({ error: '招待リンクが無効です' }, 400)
    }

    const supabaseAdmin = createSupabaseAdminClient()
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      app_metadata: { role: user.role },
    })

    return c.json({ user }, 201)
  })
  // 自分のプロフィール取得
  .openapi(meRoute, async (c) => {
    const user = c.get('user')
    return c.json({ user }, 200)
  })
