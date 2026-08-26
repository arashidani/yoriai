import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createServerClient } from '@supabase/ssr'
import { bodyLimit } from 'hono/body-limit'
import { requireEnv } from '@/lib/env'
import { DEFAULT_HIROBA_SLUGS } from '@/lib/hiroba/catalog'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  errorResponse,
  SuccessSchema,
  UserProfileSchema,
  UserSchema,
} from '@/lib/hono/openapi/schemas'
import { AVATAR_MAX_BYTES, AVATAR_TOO_LARGE_MESSAGE } from '@/lib/image/avatar-limits'
import { MOCK_AVATAR_URL, MOCK_INVITES, MOCK_USER_PROFILE, MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { updateUserProfile } from '@/lib/prisma/update-user-profile'
import { updateProfileSchema } from '@/lib/schemas/profile'
import { COMPANY_EMAIL_ERROR, companyEmailSchema } from '@/lib/schemas/register'
import { createUserSchema } from '@/lib/schemas/user'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { AvatarUploadError, deleteAvatar, uploadAvatar } from '@/lib/supabase/storage/avatar'

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
      description: '自分のプロフィール情報',
      content: { 'application/json': { schema: z.object({ user: UserProfileSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('ユーザーが見つからない', 'Not found'),
  },
})

const updateMeRoute = createRoute({
  method: 'patch',
  path: '/me',
  tags: ['users'],
  summary: '自分のプロフィールを更新',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: { required: true, content: { 'application/json': { schema: updateProfileSchema } } },
  },
  responses: {
    200: {
      description: '更新完了',
      content: { 'application/json': { schema: SuccessSchema } },
    },
    400: errorResponse('選択肢が無効', '選択した項目が無効です'),
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const uploadAvatarRoute = createRoute({
  method: 'put',
  path: '/me/avatar',
  tags: ['users'],
  summary: 'アバター画像をアップロード（512x512のWebPに変換して保存）',
  security: [{ supabaseSession: [] }],
  middleware: [
    authMiddleware,
    bodyLimit({
      maxSize: AVATAR_MAX_BYTES,
      onError: (c) => c.json({ error: AVATAR_TOO_LARGE_MESSAGE }, 413),
    }),
  ] as const,
  request: {
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
      description: '更新後のユーザー',
      content: { 'application/json': { schema: z.object({ user: UserSchema }) } },
    },
    400: errorResponse('対応していない画像形式', '対応していない画像形式です'),
    401: errorResponse('未認証', 'Unauthorized'),
    413: errorResponse('ファイルサイズ超過', AVATAR_TOO_LARGE_MESSAGE),
    422: errorResponse('画像処理に失敗', '画像を処理できませんでした'),
    502: errorResponse('アップロード失敗', '画像のアップロードに失敗しました'),
  },
})

const deleteAvatarRoute = createRoute({
  method: 'delete',
  path: '/me/avatar',
  tags: ['users'],
  summary: 'アバター画像を削除',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      description: '更新後のユーザー',
      content: { 'application/json': { schema: z.object({ user: UserSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    502: errorResponse('削除失敗', '画像の削除に失敗しました'),
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
    if (!companyEmailSchema.safeParse(authUser.email).success) {
      return c.json({ error: COMPANY_EMAIL_ERROR }, 400)
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
          hirobaMemberships: {
            create: DEFAULT_HIROBA_SLUGS.map((slug) => ({ hiroba: { connect: { slug } } })),
          },
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
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ user: MOCK_USER_PROFILE }, 200)
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        supabaseId: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        departmentId: true,
        businessAreaId: true,
        joinedYear: true,
        joinedMonth: true,
        lunchPreference: true,
        recommendedLunchSpot: true,
        bio: true,
        displayNameColor: true,
        businessSkills: { select: { businessSkillId: true } },
        interests: { select: { interestId: true } },
      },
    })
    if (!profile) return c.json({ error: 'Not found' }, 404)

    const { businessSkills, interests, ...userProfile } = profile
    return c.json(
      {
        user: {
          ...userProfile,
          businessSkillIds: businessSkills.map((item) => item.businessSkillId),
          interestIds: interests.map((item) => item.interestId),
        },
      },
      200,
    )
  })
  .openapi(updateMeRoute, async (c) => {
    const user = c.get('user')
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const saved = await updateUserProfile(user.id, data)
    if (!saved) return c.json({ error: '選択した項目が無効です' }, 400)

    return c.json({ success: true }, 200)
  })
  .openapi(uploadAvatarRoute, async (c) => {
    const user = c.get('user')
    const { file } = c.req.valid('form')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ user: { ...MOCK_USERS[0], avatarUrl: MOCK_AVATAR_URL } }, 200)
    }

    const original = Buffer.from(await file.arrayBuffer())

    let processed: Buffer
    try {
      const { processAvatarImage } = await import('@/lib/image/process-avatar')
      processed = await processAvatarImage(original)
    } catch (e) {
      const { AvatarProcessingError, UnsupportedImageError } = await import(
        '@/lib/image/process-avatar'
      )
      if (e instanceof UnsupportedImageError) return c.json({ error: e.message }, 400)
      if (e instanceof AvatarProcessingError) return c.json({ error: e.message }, 422)
      throw e
    }

    let avatarUrl: string
    try {
      avatarUrl = await uploadAvatar(user.id, processed)
    } catch (e) {
      if (e instanceof AvatarUploadError)
        return c.json({ error: '画像のアップロードに失敗しました' }, 502)
      throw e
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } })
    return c.json({ user: updated }, 200)
  })
  .openapi(deleteAvatarRoute, async (c) => {
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ user: { ...MOCK_USERS[0], avatarUrl: null } }, 200)
    }

    try {
      await deleteAvatar(user.id)
    } catch (e) {
      if (e instanceof AvatarUploadError) return c.json({ error: '画像の削除に失敗しました' }, 502)
      throw e
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } })
    return c.json({ user: updated }, 200)
  })
