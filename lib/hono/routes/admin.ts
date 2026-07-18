import { randomBytes } from 'node:crypto'
import { $, createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import { FlagStatus, Role } from '@/app/generated/prisma/enums'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  AiFlagSchema,
  BadgeSchema,
  errorResponse,
  IdParamSchema,
  InviteCreatedSchema,
  InviteListItemSchema,
  MissionSchema,
  PasswordResetCreatedSchema,
  PostSchema,
  SuccessSchema,
  UserSchema,
} from '@/lib/hono/openapi/schemas'
import {
  MOCK_AI_FLAGS,
  MOCK_BADGES,
  MOCK_INVITES,
  MOCK_MISSIONS,
  MOCK_POSTS,
  MOCK_USERS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { createBadgeSchema } from '@/lib/schemas/badge'
import { createInviteSchema } from '@/lib/schemas/invite'
import { createMissionSchema } from '@/lib/schemas/mission'
import { updateUserSchema } from '@/lib/schemas/user'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000

type InviteStatusSource = { usedAt: Date | null; expiresAt: Date }

function inviteStatus(invite: InviteStatusSource): 'PENDING' | 'USED' | 'EXPIRED' {
  if (invite.usedAt) return 'USED'
  if (invite.expiresAt < new Date()) return 'EXPIRED'
  return 'PENDING'
}

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

const createInviteRoute = createRoute({
  method: 'post',
  path: '/invites',
  tags: ['admin'],
  summary: '招待リンクを発行（管理者専用）',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: createInviteSchema } } },
  },
  responses: {
    201: {
      description: '発行された招待',
      content: { 'application/json': { schema: z.object({ invite: InviteCreatedSchema }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const listInvitesRoute = createRoute({
  method: 'get',
  path: '/invites',
  tags: ['admin'],
  summary: '招待一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: '招待一覧',
      content: {
        'application/json': { schema: z.object({ invites: z.array(InviteListItemSchema) }) },
      },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const createPasswordResetRoute = createRoute({
  method: 'post',
  path: '/users/{id}/password-resets',
  tags: ['admin'],
  summary: 'ユーザーのパスワードリセットリンクを発行（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    201: {
      description: '発行されたリセットリンク',
      content: {
        'application/json': { schema: z.object({ passwordReset: PasswordResetCreatedSchema }) },
      },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    404: errorResponse('ユーザーが見つからない'),
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

const listBadgesRoute = createRoute({
  method: 'get',
  path: '/badges',
  tags: ['admin'],
  summary: 'バッジ一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'バッジ一覧',
      content: { 'application/json': { schema: z.object({ badges: z.array(BadgeSchema) }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const createBadgeRoute = createRoute({
  method: 'post',
  path: '/badges',
  tags: ['admin'],
  summary: 'バッジを作成（管理者専用）',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: createBadgeSchema } } },
  },
  responses: {
    201: {
      description: '作成されたバッジ',
      content: { 'application/json': { schema: z.object({ badge: BadgeSchema }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const listMissionsRoute = createRoute({
  method: 'get',
  path: '/missions',
  tags: ['admin'],
  summary: 'ミッション一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'ミッション一覧',
      content: { 'application/json': { schema: z.object({ missions: z.array(MissionSchema) }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const createMissionRoute = createRoute({
  method: 'post',
  path: '/missions',
  tags: ['admin'],
  summary: 'ミッションを作成（管理者専用）',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: createMissionSchema } } },
  },
  responses: {
    201: {
      description: '作成されたミッション',
      content: { 'application/json': { schema: z.object({ mission: MissionSchema }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const listAiFlagsRoute = createRoute({
  method: 'get',
  path: '/ai-flags',
  tags: ['admin'],
  summary: 'AIフラグ一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'AIフラグ一覧',
      content: { 'application/json': { schema: z.object({ flags: z.array(AiFlagSchema) }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
  },
})

const confirmAiFlagRoute = createRoute({
  method: 'patch',
  path: '/ai-flags/{id}',
  tags: ['admin'],
  summary: 'AIフラグを確認済みにする（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '更新後のフラグ',
      content: { 'application/json': { schema: z.object({ flag: AiFlagSchema }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    404: errorResponse('フラグが見つからない'),
  },
})

export const adminRoute = $(
  new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
    .use(authMiddleware)
    .use(adminGuard),
)
  .openapi(listUsersRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ users: MOCK_USERS }, 200)
    }
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json({ users }, 200)
  })
  .openapi(createInviteRoute, async (c) => {
    const { name, role } = c.req.valid('json')
    const token = randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ invite: { token, name, role, expiresAt } }, 201)
    }

    const invite = await prisma.invite.create({
      data: { token, name, role, expiresAt },
    })
    return c.json({ invite }, 201)
  })
  .openapi(listInvitesRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ invites: MOCK_INVITES.map((i) => ({ ...i, status: inviteStatus(i) })) }, 200)
    }
    const invites = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json({ invites: invites.map((i) => ({ ...i, status: inviteStatus(i) })) }, 200)
  })
  .openapi(createPasswordResetRoute, async (c) => {
    const { id: userId } = c.req.valid('param')
    const token = randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS)

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ passwordReset: { token, expiresAt } }, 201)
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return c.json({ error: 'Not found' }, 404)

    await prisma.passwordReset.create({ data: { token, userId, expiresAt } })
    return c.json({ passwordReset: { token, expiresAt } }, 201)
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
        200,
      )
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { ...(name !== undefined && { name }), ...(role !== undefined && { role }) },
    })

    if (role !== undefined) {
      const supabaseAdmin = createSupabaseAdminClient()
      await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
        app_metadata: { role: user.role },
      })
    }

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
  .openapi(listBadgesRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ badges: MOCK_BADGES }, 200)
    }
    const badges = await prisma.badge.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json({ badges }, 200)
  })
  .openapi(createBadgeRoute, async (c) => {
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          badge: {
            id: `badge-${MOCK_BADGES.length + 1}`,
            ...data,
            earnedCount: 0,
            createdAt: new Date(),
          },
        },
        201,
      )
    }

    const badge = await prisma.badge.create({ data })
    return c.json({ badge }, 201)
  })
  .openapi(listMissionsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ missions: MOCK_MISSIONS }, 200)
    }
    const missions = await prisma.mission.findMany({
      include: { rewardBadge: true },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ missions }, 200)
  })
  .openapi(createMissionRoute, async (c) => {
    const { rewardBadgeId, ...rest } = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      const rewardBadge = rewardBadgeId
        ? (MOCK_BADGES.find((b) => b.id === rewardBadgeId) ?? null)
        : null
      return c.json(
        {
          mission: {
            id: `mission-${MOCK_MISSIONS.length + 1}`,
            ...rest,
            rewardBadgeId: rewardBadgeId ?? null,
            rewardBadge,
            active: true,
            participantsCount: 0,
            progressPercent: 0,
            createdAt: new Date(),
          },
        },
        201,
      )
    }

    const mission = await prisma.mission.create({
      data: { ...rest, rewardBadgeId: rewardBadgeId || null },
      include: { rewardBadge: true },
    })
    return c.json({ mission }, 201)
  })
  .openapi(listAiFlagsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ flags: MOCK_AI_FLAGS }, 200)
    }
    const flags = await prisma.aiFlag.findMany({
      include: { targetUser: true, post: true },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ flags }, 200)
  })
  .openapi(confirmAiFlagRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const flag = MOCK_AI_FLAGS.find((f) => f.id === id)
      if (!flag) return c.json({ error: 'Not found' }, 404)
      return c.json({ flag: { ...flag, status: FlagStatus.CONFIRMED } }, 200)
    }

    const flag = await prisma.aiFlag.update({
      where: { id },
      data: { status: FlagStatus.CONFIRMED },
      include: { targetUser: true, post: true },
    })
    return c.json({ flag }, 200)
  })
