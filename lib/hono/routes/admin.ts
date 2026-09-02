import { randomBytes } from 'node:crypto'
import { $, createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import { createMiddleware } from 'hono/factory'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagStatus, Role } from '@/app/generated/prisma/enums'
import { HIROBA_CATALOG } from '@/lib/hiroba/catalog'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  AdminPostDetailSchema,
  AdminTagSchema,
  AiFlagSchema,
  AnonymousProfileSchema,
  AnswerSchema,
  errorResponse,
  HirobaSchema,
  IdParamSchema,
  InviteCreatedSchema,
  InviteListItemSchema,
  PasswordResetCreatedSchema,
  PostSchema,
  SuccessSchema,
  TagCategorySchema,
  UserSchema,
} from '@/lib/hono/openapi/schemas'
import { AVATAR_MAX_BYTES, AVATAR_TOO_LARGE_MESSAGE } from '@/lib/image/avatar-limits'
import {
  AvatarProcessingError,
  processAvatarImage,
  UnsupportedImageError,
} from '@/lib/image/process-avatar'
import {
  MOCK_AI_FLAGS,
  MOCK_ANONYMOUS_PROFILES,
  MOCK_ANSWERS,
  MOCK_HIROBAS,
  MOCK_INVITES,
  MOCK_POSTS,
  MOCK_TAG_CATEGORIES,
  MOCK_TAGS,
  MOCK_USERS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import {
  toAdminAnswerResponse,
  toAdminModerationAnswerResponse,
  toAnswerAnonymousProfileResponse,
} from '@/lib/questions/admin-answer-response'
import {
  createAnonymousProfileSchema,
  updateAnonymousProfileSchema,
} from '@/lib/schemas/anonymous-profile'
import { createInviteSchema } from '@/lib/schemas/invite'
import { createTagSchema, updateTagSchema } from '@/lib/schemas/tag'
import { createTagCategorySchema } from '@/lib/schemas/tag-category'
import { updateUserSchema } from '@/lib/schemas/user'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  AnonymousProfileAvatarUploadError,
  uploadAnonymousProfileAvatar,
} from '@/lib/supabase/storage/anonymous-profile-avatar'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000

type InviteStatusSource = { usedAt: Date | null; expiresAt: Date }

function inviteStatus(invite: InviteStatusSource): 'PENDING' | 'USED' | 'EXPIRED' {
  if (invite.usedAt) return 'USED'
  if (invite.expiresAt < new Date()) return 'EXPIRED'
  return 'PENDING'
}

function toMockAdminModerationAnswer(answer: (typeof MOCK_ANSWERS)[number]) {
  return {
    id: answer.id,
    postId: answer.postId,
    body: answer.body,
    isHidden: answer.isHidden,
    likeCount: answer.likeCount,
    anonymousProfile: toAnswerAnonymousProfileResponse(answer.anonymousProfile),
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
    authorId: answer.authorId,
    author: answer.author,
    hiddenAt: 'hiddenAt' in answer ? (answer.hiddenAt ?? null) : null,
    hiddenReason: 'hiddenReason' in answer ? (answer.hiddenReason ?? null) : null,
  }
}

function toMockAiFlagResponse(flag: (typeof MOCK_AI_FLAGS)[number]) {
  return {
    ...flag,
    answer: flag.answer
      ? {
          id: flag.answer.id,
          postId: flag.answer.postId,
          body: flag.answer.body,
          isHidden: flag.answer.isHidden,
          likeCount: flag.answer.likeCount,
          anonymousProfile: toAnswerAnonymousProfileResponse(flag.answer.anonymousProfile),
          createdAt: flag.answer.createdAt,
          updatedAt: flag.answer.updatedAt,
        }
      : null,
  }
}

const ANONYMOUS_PROFILE_DISPLAY_NAME_CONFLICT_MESSAGE =
  '同じ表示名の匿名キャラがすでに登録されています'

/** AnonymousProfile.displayName の一意制約違反（P2002）だけを判定する */
function isDisplayNameConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }
  const target = error.meta?.target
  const fields = Array.isArray(target) ? target : typeof target === 'string' ? [target] : []
  return fields.some((field) => String(field).includes('displayName'))
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

const deleteInviteRoute = createRoute({
  method: 'delete',
  path: '/invites/{id}',
  tags: ['admin'],
  summary: '招待リンクを削除（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
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

const getPostRoute = createRoute({
  method: 'get',
  path: '/posts/{id}',
  tags: ['admin'],
  summary: '非表示投稿を含む投稿詳細を取得（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '投稿詳細',
      content: { 'application/json': { schema: AdminPostDetailSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('投稿が見つからない', 'Not found'),
  },
})

const deletePostRoute = createRoute({
  method: 'delete',
  path: '/posts/{id}',
  tags: ['admin'],
  summary: '投稿を削除（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
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
    409: errorResponse(
      '同じ表示名の匿名キャラがすでに存在する',
      ANONYMOUS_PROFILE_DISPLAY_NAME_CONFLICT_MESSAGE,
    ),
  },
})

const updateAnonymousProfileRoute = createRoute({
  method: 'patch',
  path: '/anonymous-profiles/{id}',
  tags: ['admin'],
  summary: '匿名キャラの有効状態またはアバター表示順を更新（管理者専用）',
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
    400: errorResponse('アバターの並び順が不正', '登録済みのアバターだけを並べ替えられます'),
    404: errorResponse('匿名キャラが見つからない', 'Not found'),
  },
})

const uploadAnonymousProfileAvatarRoute = createRoute({
  method: 'post',
  path: '/anonymous-profiles/{id}/avatars',
  tags: ['admin'],
  summary: '匿名キャラのアバターを追加（管理者専用）',
  security,
  middleware: [
    bodyLimit({
      maxSize: AVATAR_MAX_BYTES,
      onError: (c) => c.json({ error: AVATAR_TOO_LARGE_MESSAGE }, 413),
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
      description: 'アバター追加後の匿名キャラ',
      content: { 'application/json': { schema: z.object({ profile: AnonymousProfileSchema }) } },
    },
    400: errorResponse('対応していない画像形式', '対応していない画像形式です'),
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('匿名キャラが見つからない', 'Not found'),
    413: errorResponse('ファイルサイズ超過', AVATAR_TOO_LARGE_MESSAGE),
    422: errorResponse('画像処理に失敗', '画像を処理できませんでした'),
    502: errorResponse('アップロード失敗', '画像のアップロードに失敗しました'),
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
    409: errorResponse(
      'すでに質問スレッドで使われているため削除できない',
      'すでに使われている匿名キャラは削除できません。候補から外すには無効化してください',
    ),
  },
})

const listTagsRoute = createRoute({
  method: 'get',
  path: '/tags',
  tags: ['admin'],
  summary: 'タグ一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'タグ一覧',
      content: { 'application/json': { schema: z.object({ tags: z.array(AdminTagSchema) }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

const listTagCategoriesRoute = createRoute({
  method: 'get',
  path: '/tag-categories',
  tags: ['admin'],
  summary: 'タグカテゴリー一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'タグカテゴリー一覧',
      content: {
        'application/json': { schema: z.object({ categories: z.array(TagCategorySchema) }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

const createTagCategoryRoute = createRoute({
  method: 'post',
  path: '/tag-categories',
  tags: ['admin'],
  summary: 'タグカテゴリーを作成（管理者専用）',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: createTagCategorySchema } } },
  },
  responses: {
    201: {
      description: '作成されたタグカテゴリー',
      content: { 'application/json': { schema: z.object({ category: TagCategorySchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    409: errorResponse(
      '同名のタグカテゴリーがすでに存在する',
      '同じ名前のカテゴリーがすでに存在します',
    ),
  },
})

const deleteTagCategoryRoute = createRoute({
  method: 'delete',
  path: '/tag-categories/{id}',
  tags: ['admin'],
  summary: 'タグカテゴリーを削除（使用中は削除不可）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('タグカテゴリーが見つからない', 'Not found'),
    409: errorResponse(
      'タグで使用中のため削除不可',
      'このカテゴリーを使用しているタグがあるため削除できません',
    ),
  },
})

const createTagRoute = createRoute({
  method: 'post',
  path: '/tags',
  tags: ['admin'],
  summary: 'タグを作成（管理者専用）',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: createTagSchema } } },
  },
  responses: {
    201: {
      description: '作成されたタグ',
      content: { 'application/json': { schema: z.object({ tag: AdminTagSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    409: errorResponse('同名のタグがすでに存在する', '同じ名前のタグがすでに存在します'),
  },
})

const updateTagRoute = createRoute({
  method: 'patch',
  path: '/tags/{id}',
  tags: ['admin'],
  summary: 'タグを更新（管理者専用）',
  security,
  request: {
    params: IdParamSchema,
    body: { required: true, content: { 'application/json': { schema: updateTagSchema } } },
  },
  responses: {
    200: {
      description: '更新されたタグ',
      content: { 'application/json': { schema: z.object({ tag: AdminTagSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('タグが見つからない', 'Not found'),
    409: errorResponse(
      '同名タグまたはカテゴリー変更による割り当て競合',
      'カテゴリー変更により1つの投稿へ同じカテゴリーのタグが複数割り当てられます',
    ),
  },
})

const deleteTagRoute = createRoute({
  method: 'delete',
  path: '/tags/{id}',
  tags: ['admin'],
  summary: 'タグを削除（管理者専用）',
  security,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '削除成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('タグが見つからない', 'Not found'),
  },
})

const listHirobasRoute = createRoute({
  method: 'get',
  path: '/hiroba',
  tags: ['admin'],
  summary: '固定ひろば一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: 'ひろば一覧',
      content: { 'application/json': { schema: z.object({ hirobas: z.array(HirobaSchema) }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
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
  .openapi(deleteInviteRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    try {
      await prisma.invite.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return c.json({ success: true }, 200)
      }
      throw error
    }
    return c.json({ success: true }, 200)
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
  .openapi(getPostRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((item) => item.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_ANSWERS.filter((answer) => answer.postId === id).map(
        toMockAdminModerationAnswer,
      )
      const flags = MOCK_AI_FLAGS.filter(
        (flag) => flag.postId === id || answers.some((answer) => answer.id === flag.answerId),
      ).map(toMockAiFlagResponse)
      return c.json({ post, answers, flags }, 200)
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        answers: {
          include: {
            author: true,
            postAnonymousProfile: { include: { anonymousProfile: true } },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)

    const flags = await prisma.aiFlag.findMany({
      where: { OR: [{ postId: id }, { answer: { postId: id } }] },
      include: {
        targetUser: true,
        post: true,
        answer: { include: { postAnonymousProfile: { include: { anonymousProfile: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const { answers, ...postData } = post
    return c.json(
      {
        post: postData,
        answers: answers.map(toAdminModerationAnswerResponse),
        flags: flags.map((flag) => ({
          ...flag,
          answer: flag.answer ? toAdminAnswerResponse(flag.answer) : null,
        })),
      },
      200,
    )
  })
  .openapi(deletePostRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') return c.json({ success: true }, 200)

    try {
      await prisma.post.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return c.json({ success: true }, 200)
      }
      throw error
    }
    return c.json({ success: true }, 200)
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
      const { anonymousProfile, ...rest } = answer
      return c.json(
        {
          answer: {
            ...rest,
            isHidden: false,
            anonymousProfile: toAnswerAnonymousProfileResponse(anonymousProfile),
          },
        },
        200,
      )
    }

    const existing = await prisma.answer.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const [answer] = await prisma.$transaction([
      prisma.answer.update({
        where: { id },
        data: { isHidden: false, hiddenAt: null, hiddenByUserId: null, hiddenReason: null },
        include: { postAnonymousProfile: { include: { anonymousProfile: true } } },
      }),
      ...(existing.isHidden
        ? [
            prisma.post.update({
              where: { id: existing.postId },
              data: { answerCount: { increment: 1 } },
            }),
          ]
        : []),
    ])
    return c.json({ answer: toAdminAnswerResponse(answer) }, 200)
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

    try {
      await prisma.user.delete({ where: { id: targetId } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return c.json({ success: true }, 200)
      }
      throw error
    }
    return c.json({ success: true }, 200)
  })
  .openapi(listAiFlagsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ flags: MOCK_AI_FLAGS.map(toMockAiFlagResponse) }, 200)
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
      {
        flags: flags.map((f) => ({
          ...f,
          answer: f.answer ? toAdminAnswerResponse(f.answer) : null,
        })),
      },
      200,
    )
  })
  .openapi(confirmAiFlagRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const flag = MOCK_AI_FLAGS.find((f) => f.id === id)
      if (!flag) return c.json({ error: 'Not found' }, 404)
      return c.json({ flag: { ...toMockAiFlagResponse(flag), status: FlagStatus.CONFIRMED } }, 200)
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
      { flag: { ...flag, answer: flag.answer ? toAdminAnswerResponse(flag.answer) : null } },
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
            avatarUrls: [],
            isActive: true,
            createdAt: new Date(),
          },
        },
        201,
      )
    }

    try {
      const profile = await prisma.anonymousProfile.create({ data })
      return c.json({ profile }, 201)
    } catch (error) {
      if (isDisplayNameConflict(error)) {
        return c.json({ error: ANONYMOUS_PROFILE_DISPLAY_NAME_CONFLICT_MESSAGE }, 409)
      }
      throw error
    }
  })
  .openapi(updateAnonymousProfileRoute, async (c) => {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      const profile = MOCK_ANONYMOUS_PROFILES.find((p) => p.id === id)
      if (!profile) return c.json({ error: 'Not found' }, 404)
      return c.json({ profile: { ...profile, ...data } }, 200)
    }

    const existing = await prisma.anonymousProfile.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    if (data.avatarUrls) {
      const isSameAvatarSet =
        data.avatarUrls.length === existing.avatarUrls.length &&
        [...data.avatarUrls]
          .sort()
          .every((url, index) => url === [...existing.avatarUrls].sort()[index])
      if (!isSameAvatarSet)
        return c.json({ error: '登録済みのアバターだけを並べ替えられます' }, 400)
    }

    const profile = await prisma.anonymousProfile.update({ where: { id }, data })
    return c.json({ profile }, 200)
  })
  .openapi(uploadAnonymousProfileAvatarRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { file } = c.req.valid('form')

    if (process.env.MOCK_MODE === 'true') {
      const profile = MOCK_ANONYMOUS_PROFILES.find((item) => item.id === id)
      if (!profile) return c.json({ error: 'Not found' }, 404)
      return c.json(
        {
          profile: {
            ...profile,
            avatarUrls: [...profile.avatarUrls, '/anonymous-profiles/new.svg'],
          },
        },
        200,
      )
    }

    const existing = await prisma.anonymousProfile.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (existing.avatarUrls.length >= 20) {
      return c.json({ error: 'アバターは20枚までです' }, 400)
    }

    let image: Buffer
    try {
      image = await processAvatarImage(Buffer.from(await file.arrayBuffer()))
    } catch (error) {
      if (error instanceof UnsupportedImageError) return c.json({ error: error.message }, 400)
      if (error instanceof AvatarProcessingError) return c.json({ error: error.message }, 422)
      throw error
    }

    try {
      const avatarUrl = await uploadAnonymousProfileAvatar(id, image)
      const profile = await prisma.anonymousProfile.update({
        where: { id },
        data: { avatarUrls: { push: avatarUrl } },
      })
      return c.json({ profile }, 200)
    } catch (error) {
      if (error instanceof AnonymousProfileAvatarUploadError) {
        return c.json({ error: '画像のアップロードに失敗しました' }, 502)
      }
      throw error
    }
  })
  .openapi(deleteAnonymousProfileRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const existing = await prisma.anonymousProfile.findUnique({ where: { id } })
    if (!existing) return c.json({ success: true }, 200)

    try {
      await prisma.anonymousProfile.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return c.json({ success: true }, 200)
      }
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
  .openapi(listTagCategoriesRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ categories: MOCK_TAG_CATEGORIES }, 200)
    }
    const categories = await prisma.tagCategory.findMany({ orderBy: { name: 'asc' } })
    return c.json({ categories }, 200)
  })
  .openapi(createTagCategoryRoute, async (c) => {
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          category: {
            id: `tag-category-${MOCK_TAG_CATEGORIES.length + 1}`,
            ...data,
            createdAt: new Date(),
          },
        },
        201,
      )
    }

    try {
      const category = await prisma.tagCategory.create({ data })
      return c.json({ category }, 201)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return c.json({ error: '同じ名前のカテゴリーがすでに存在します' }, 409)
      }
      throw error
    }
  })
  .openapi(deleteTagCategoryRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const existing = await prisma.tagCategory.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    try {
      await prisma.tagCategory.delete({ where: { id } })
      return c.json({ success: true }, 200)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return c.json({ error: 'このカテゴリーを使用しているタグがあるため削除できません' }, 409)
      }
      throw error
    }
  })
  .openapi(listTagsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ tags: MOCK_TAGS }, 200)
    }
    const tags = await prisma.tag.findMany({ orderBy: { createdAt: 'desc' } })
    return c.json({ tags }, 200)
  })
  .openapi(createTagRoute, async (c) => {
    const { description, ...data } = c.req.valid('json')
    const tagData = { ...data, description: description || null }

    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        { tag: { id: `tag-${MOCK_TAGS.length + 1}`, ...tagData, createdAt: new Date() } },
        201,
      )
    }

    try {
      const tag = await prisma.tag.create({ data: tagData })
      return c.json({ tag }, 201)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return c.json({ error: '同じ名前のタグがすでに存在します' }, 409)
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return c.json({ error: '指定されたカテゴリーが見つかりません' }, 409)
      }
      throw error
    }
  })
  .openapi(updateTagRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { description, ...data } = c.req.valid('json')
    const tagData = { ...data, description: description || null }

    if (process.env.MOCK_MODE === 'true') {
      const existing = MOCK_TAGS.find((tag) => tag.id === id)
      if (!existing) return c.json({ error: 'Not found' }, 404)
      return c.json({ tag: { ...existing, ...tagData } }, 200)
    }

    const existing = await prisma.tag.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    if (existing.category !== tagData.category) {
      const [postConflict, hirobaConflict] = await Promise.all([
        tagData.isWorkTag
          ? prisma.postTag.findFirst({
              where: {
                tagId: id,
                post: {
                  tags: { some: { tagId: { not: id }, tag: { category: tagData.category } } },
                },
              },
              select: { id: true },
            })
          : null,
        prisma.hirobaPostTag.findFirst({
          where: {
            tagId: id,
            hirobaPost: {
              tags: { some: { tagId: { not: id }, tag: { category: tagData.category } } },
            },
          },
          select: { id: true },
        }),
      ])
      if (postConflict || hirobaConflict) {
        return c.json(
          { error: 'カテゴリー変更により1つの投稿へ同じカテゴリーのタグが複数割り当てられます' },
          409,
        )
      }
    }

    try {
      const tag =
        existing.isWorkTag && !tagData.isWorkTag
          ? await prisma.$transaction(async (tx) => {
              await tx.postTag.deleteMany({ where: { tagId: id } })
              return tx.tag.update({ where: { id }, data: tagData })
            })
          : await prisma.tag.update({ where: { id }, data: tagData })
      return c.json({ tag }, 200)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return c.json({ error: '同じ名前のタグがすでに存在します' }, 409)
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return c.json({ error: '指定されたカテゴリーが見つかりません' }, 409)
      }
      throw error
    }
  })
  .openapi(deleteTagRoute, async (c) => {
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const existing = await prisma.tag.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Not found' }, 404)

    await prisma.tag.delete({ where: { id } })
    return c.json({ success: true }, 200)
  })
  .openapi(listHirobasRoute, async (c) => {
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
