import { randomBytes } from 'node:crypto'
import { $, createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagStatus, Role } from '@/app/generated/prisma/enums'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  AiFlagSchema,
  AnonymousProfileSchema,
  AnswerSchema,
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
import { toAnswerResponse } from '@/lib/hono/routes/posts'
import {
  MOCK_AI_FLAGS,
  MOCK_ANONYMOUS_PROFILES,
  MOCK_ANSWERS,
  MOCK_BADGES,
  MOCK_INVITES,
  MOCK_MISSIONS,
  MOCK_POSTS,
  MOCK_USERS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import {
  createAnonymousProfileSchema,
  updateAnonymousProfileSchema,
} from '@/lib/schemas/anonymous-profile'
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('ユーザーが見つからない', 'Not found'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

const restorePostRoute = createRoute({
  method: 'patch',
  path: '/posts/{id}/restore',
  tags: ['admin'],
  summary: 'ソフトデリートされた投稿を復元（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '復元後の投稿',
      content: { 'application/json': { schema: z.object({ post: PostSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const restoreAnswerRoute = createRoute({
  method: 'patch',
  path: '/answers/{id}/restore',
  tags: ['admin'],
  summary: '非表示にされた回答を復元（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '復元後の回答',
      content: { 'application/json': { schema: z.object({ answer: AnswerSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('回答が見つからない', 'Not found'),
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
    400: errorResponse('自分自身のロールは変更できないなど', '自分自身のロールは変更できません'),
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    400: errorResponse('自分自身は削除できない', '自分自身は削除できません'),
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('フラグが見つからない', 'Not found'),
  },
})

const listAnonymousProfilesRoute = createRoute({
  method: 'get',
  path: '/anonymous-profiles',
  tags: ['admin'],
  summary: '匿名キャラ一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: '匿名キャラ一覧',
      content: {
        'application/json': { schema: z.object({ profiles: z.array(AnonymousProfileSchema) }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

const createAnonymousProfileRoute = createRoute({
  method: 'post',
  path: '/anonymous-profiles',
  tags: ['admin'],
  summary: '匿名キャラを追加（管理者専用）',
  security,
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createAnonymousProfileSchema } },
    },
  },
  responses: {
    201: {
      description: '追加された匿名キャラ',
      content: { 'application/json': { schema: z.object({ profile: AnonymousProfileSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

const updateAnonymousProfileRoute = createRoute({
  method: 'patch',
  path: '/anonymous-profiles/{id}',
  tags: ['admin'],
  summary: '匿名キャラの割り当て候補への出し入れを切り替える（管理者専用）',
  security,
  request: {
    params: IdParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: updateAnonymousProfileSchema } },
    },
  },
  responses: {
    200: {
      description: '更新後の匿名キャラ',
      content: { 'application/json': { schema: z.object({ profile: AnonymousProfileSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('匿名キャラが見つからない', 'Not found'),
  },
})

const deleteAnonymousProfileRoute = createRoute({
  method: 'delete',
  path: '/anonymous-profiles/{id}',
  tags: ['admin'],
  summary: '匿名キャラを削除（管理者専用、割り当て済みのキャラは削除不可）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('匿名キャラが見つからない', 'Not found'),
    409: errorResponse(
      'すでに質問スレッドで使われているため削除できない',
      'すでに使われている匿名キャラは削除できません。候補から外すには無効化してください',
    ),
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
      orderBy: { updatedAt: 'desc' },
    })
    return c.json({ posts }, 200)
  })
  .openapi(restorePostRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ post: { ...post, deletedAt: null } }, 200)
    }

    const existing = await prisma.post.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const post = await prisma.post.update({
      where: { id },
      data: { deletedAt: null },
      include: { author: true },
    })
    return c.json({ post }, 200)
  })
  .openapi(restoreAnswerRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const answer = MOCK_ANSWERS.find((a) => a.id === id)
      if (!answer) return c.json({ error: 'Not found' }, 404)
      return c.json({ answer: { ...answer, isHidden: false } }, 200)
    }

    const existing = await prisma.answer.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const answer = await prisma.answer.update({
      where: { id },
      data: { isHidden: false, hiddenAt: null, hiddenByUserId: null, hiddenReason: null },
      include: { postAnonymousProfile: { include: { anonymousProfile: true } } },
    })
    return c.json({ answer: toAnswerResponse(answer) }, 200)
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
      include: {
        targetUser: true,
        post: true,
        answer: { include: { postAnonymousProfile: { include: { anonymousProfile: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return c.json(
      { flags: flags.map((f) => ({ ...f, answer: f.answer ? toAnswerResponse(f.answer) : null })) },
      200,
    )
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
      include: {
        targetUser: true,
        post: true,
        answer: { include: { postAnonymousProfile: { include: { anonymousProfile: true } } } },
      },
    })
    return c.json(
      { flag: { ...flag, answer: flag.answer ? toAnswerResponse(flag.answer) : null } },
      200,
    )
  })
  .openapi(listAnonymousProfilesRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ profiles: MOCK_ANONYMOUS_PROFILES }, 200)
    }
    const profiles = await prisma.anonymousProfile.findMany({ orderBy: { createdAt: 'asc' } })
    return c.json({ profiles }, 200)
  })
  .openapi(createAnonymousProfileRoute, async (c) => {
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          profile: {
            id: `anon-${MOCK_ANONYMOUS_PROFILES.length + 1}`,
            ...data,
            isActive: true,
            createdAt: new Date(),
          },
        },
        201,
      )
    }

    const profile = await prisma.anonymousProfile.create({ data })
    return c.json({ profile }, 201)
  })
  .openapi(updateAnonymousProfileRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { isActive } = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      const profile = MOCK_ANONYMOUS_PROFILES.find((p) => p.id === id)
      if (!profile) return c.json({ error: 'Not found' }, 404)
      return c.json({ profile: { ...profile, isActive } }, 200)
    }

    const existing = await prisma.anonymousProfile.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const profile = await prisma.anonymousProfile.update({ where: { id }, data: { isActive } })
    return c.json({ profile }, 200)
  })
  .openapi(deleteAnonymousProfileRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const existing = await prisma.anonymousProfile.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    try {
      await prisma.anonymousProfile.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return c.json(
          {
            error:
              'すでに使われている匿名キャラは削除できません。候補から外すには無効化してください',
          },
          409,
        )
      }
      throw error
    }
    return c.json({ success: true }, 200)
  })
