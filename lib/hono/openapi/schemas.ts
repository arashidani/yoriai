import { z } from '@hono/zod-openapi'

/**
 * バックエンドのレスポンス用スキーマ。
 * OpenAPIドキュメントの components.schemas に登録され、ハンドラの戻り値型チェックにも使われる。
 * リクエスト用スキーマ（バリデーション）は lib/schemas/ 側でフロントと共有している。
 */

/** Prisma の Date をそのまま c.json に渡せるよう入力型は Date のまま、ドキュメント表現だけ date-time 文字列にする */
const dateTime = () =>
  z.date().openapi({ type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' })

export const UserSchema = z
  .object({
    id: z.string().openapi({ example: 'user-1' }),
    supabaseId: z.string().openapi({ example: 'supabase-user-1' }),
    email: z.string().openapi({ example: 'user@example.com' }),
    name: z.string().nullable().openapi({ example: '一般ユーザー' }),
    role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER' }),
    createdAt: dateTime(),
  })
  .openapi('User')

export const PostSchema = z
  .object({
    id: z.string().openapi({ example: 'post-1' }),
    title: z.string().openapi({ example: 'Next.js App Routerの使い方を教えてください' }),
    body: z.string().openapi({ example: 'App Router と Pages Router の違いが分かりません。' }),
    authorId: z.string().nullable().openapi({ example: 'user-2' }),
    author: z.union([UserSchema, z.null()]).optional(),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('Post')

export const BadgeSchema = z
  .object({
    id: z.string().openapi({ example: 'badge-1' }),
    name: z.string().openapi({ example: '初投稿' }),
    description: z.string().openapi({ example: '初めて投稿を作成した' }),
    icon: z.string().openapi({ example: 'Medal' }),
    rarity: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).openapi({ example: 'BRONZE' }),
    earnedCount: z.number().openapi({ example: 842 }),
    createdAt: dateTime(),
  })
  .openapi('Badge')

export const MissionSchema = z
  .object({
    id: z.string().openapi({ example: 'mission-1' }),
    name: z.string().openapi({ example: '週に5件投稿' }),
    description: z.string().openapi({ example: '1週間で5件の投稿を作成する' }),
    durationLabel: z.string().openapi({ example: '1週間' }),
    targetCount: z.number().openapi({ example: 5 }),
    active: z.boolean().openapi({ example: true }),
    participantsCount: z.number().openapi({ example: 189 }),
    progressPercent: z.number().openapi({ example: 62 }),
    rewardBadgeId: z.string().nullable().openapi({ example: 'badge-1' }),
    rewardBadge: z.union([BadgeSchema, z.null()]).optional(),
    createdAt: dateTime(),
  })
  .openapi('Mission')

export const AiFlagSchema = z
  .object({
    id: z.string().openapi({ example: 'flag-1' }),
    title: z.string().openapi({ example: '攻撃的な表現を検出' }),
    detail: z.string().openapi({ example: '投稿内に攻撃的な表現が含まれています' }),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).openapi({ example: 'HIGH' }),
    status: z.enum(['UNREAD', 'CONFIRMED']).openapi({ example: 'UNREAD' }),
    targetUserId: z.string().nullable().openapi({ example: 'user-1' }),
    targetUser: z.union([UserSchema, z.null()]).optional(),
    createdAt: dateTime(),
  })
  .openapi('AiFlag')

export const InviteSchema = z
  .object({
    name: z.string().nullable().openapi({ example: '山田 太郎（仮）' }),
    role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER' }),
  })
  .openapi('Invite')

export const InviteCreatedSchema = z
  .object({
    token: z.string().openapi({ example: 'a1b2c3...' }),
    name: z.string().nullable().openapi({ example: '山田 太郎（仮）' }),
    role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER' }),
    expiresAt: dateTime(),
  })
  .openapi('InviteCreated')

export const InviteListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'invite-1' }),
    name: z.string().nullable().openapi({ example: '山田 太郎（仮）' }),
    role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER' }),
    status: z.enum(['PENDING', 'USED', 'EXPIRED']).openapi({ example: 'PENDING' }),
    expiresAt: dateTime(),
    createdAt: dateTime(),
  })
  .openapi('InviteListItem')

export const PasswordResetCreatedSchema = z
  .object({
    token: z.string().openapi({ example: 'a1b2c3...' }),
    expiresAt: dateTime(),
  })
  .openapi('PasswordResetCreated')

export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'Not found' }),
  })
  .openapi('Error')

export const SuccessSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
  })
  .openapi('Success')

/** パスパラメータ :id */
export const IdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: 'post-1' }),
})

/** よく使うエラーレスポンス定義 */
export const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorSchema } },
})
