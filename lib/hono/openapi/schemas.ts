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
    username: z.string().nullable().openapi({ example: 'あおさん' }),
    displayNameColor: z
      .enum(['GREEN', 'YELLOW', 'BLUE', 'PURPLE', 'GRAY'])
      .nullable()
      .openapi({ example: 'BLUE' }),
    avatarUrl: z.string().nullable().openapi({
      example: 'https://xxxx.supabase.co/storage/v1/object/public/profiles/user-1.webp?v=1',
    }),
    role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER' }),
    createdAt: dateTime(),
  })
  .openapi('User')

export const UserProfileSchema = UserSchema.extend({
  departmentId: z.string().nullable().openapi({ example: 'department-1' }),
  businessAreaId: z.string().nullable().openapi({ example: 'business-area-1' }),
  joinedYear: z.number().int().nullable().openapi({ example: 2024 }),
  joinedMonth: z.number().int().nullable().openapi({ example: 4 }),
  businessSkillIds: z.array(z.string()).openapi({ example: ['business-skill-1'] }),
  interestIds: z.array(z.string()).openapi({ example: ['interest-1'] }),
  lunchPreference: z
    .enum(['NO_PREFERENCE', 'TEAM', 'ALONE'])
    .nullable()
    .openapi({ example: 'TEAM' }),
  recommendedLunchSpot: z.string().nullable().openapi({ example: '駅前食堂' }),
  bio: z.string().nullable().openapi({ example: 'よろしくお願いします' }),
}).openapi('UserProfile')

export const ProfileOptionSchema = z
  .object({
    id: z.string().openapi({ example: 'option-1' }),
    name: z.string().openapi({ example: '開発部' }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('ProfileOption')

export const TagSchema = z
  .object({
    id: z.string().openapi({ example: 'tag-1' }),
    name: z.string().openapi({ example: '経理' }),
    createdAt: dateTime(),
  })
  .openapi('Tag')

export const AdminTagSchema = z
  .object({
    id: z.string().openapi({ example: 'tag-1' }),
    name: z.string().openapi({ example: '給与' }),
    category: z.string().openapi({ example: '人事' }),
    description: z
      .string()
      .nullable()
      .openapi({ example: '給与計算、給与明細、控除に関する投稿に使用します。' }),
    isWorkTag: z.boolean().openapi({ example: true }),
    createdAt: dateTime(),
  })
  .openapi('AdminTag')

export const TagCategorySchema = z
  .object({
    id: z.string().openapi({ example: 'tag-category-1' }),
    name: z.string().openapi({ example: '人事' }),
    createdAt: dateTime(),
  })
  .openapi('TagCategory')

export const PostSchema = z
  .object({
    id: z.string().openapi({ example: 'post-1' }),
    title: z.string().openapi({ example: 'Next.js App Routerの使い方を教えてください' }),
    body: z.string().openapi({ example: 'App Router と Pages Router の違いが分かりません。' }),
    authorId: z.string().nullable().openapi({ example: 'user-2' }),
    // .nullable() だと登録済みコンポーネント User 自体が nullable になるため union で書く
    author: z.union([UserSchema, z.null()]).optional(),
    status: z.enum(['OPEN', 'RESOLVED', 'HIDDEN']).openapi({ example: 'OPEN' }),
    answerCount: z.number().openapi({ example: 0 }),
    likeCount: z.number().openapi({ example: 0 }),
    resolvedAt: z.union([dateTime(), z.null()]).openapi({ example: null }),
    deletedAt: z.union([dateTime(), z.null()]).openapi({ example: null }),
    /** AIが投稿作成時に最大3件自動付与するタグ（ユーザーは付与・変更不可） */
    tags: z.array(TagSchema).optional().openapi({ example: [] }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('Post')

export const HirobaSchema = z
  .object({
    id: z.string().openapi({ example: 'hiroba-alcohol' }),
    slug: z.string().openapi({ example: 'alcohol' }),
    name: z.string().openapi({ example: 'お酒' }),
    description: z.string().openapi({ example: 'みんなで気軽に話せる広場です。' }),
    createdAt: dateTime(),
  })
  .openapi('Hiroba')

export const HirobaPostSchema = z
  .object({
    id: z.string().openapi({ example: 'hiroba-post-1' }),
    hirobaId: z.string().openapi({ example: 'hiroba-alcohol' }),
    title: z.string().openapi({ example: '今日のランチどこ行きました？' }),
    body: z.string().openapi({ example: '近くに新しくできたお店に行ってみました。' }),
    imageUrl: z.string().nullable().openapi({ example: null }),
    authorId: z.string().nullable().openapi({ example: 'user-2' }),
    author: z.union([UserSchema, z.null()]).optional(),
    answerCount: z.number().openapi({ example: 0 }),
    likeCount: z.number().openapi({ example: 0 }),
    deletedAt: z.union([dateTime(), z.null()]).openapi({ example: null }),
    tags: z.array(TagSchema).optional().openapi({ example: [] }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('HirobaPost')

export const HirobaAnswerSchema = z
  .object({
    id: z.string().openapi({ example: 'hiroba-answer-1' }),
    hirobaPostId: z.string().openapi({ example: 'hiroba-post-1' }),
    body: z.string().openapi({ example: 'いいですね、今度行ってみます！' }),
    authorId: z.string().nullable().openapi({ example: 'user-1' }),
    author: z.union([UserSchema, z.null()]).optional(),
    isHidden: z.boolean().openapi({ example: false }),
    likeCount: z.number().openapi({ example: 0 }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('HirobaAnswer')

export const AnonymousProfileSchema = z
  .object({
    id: z.string().openapi({ example: 'anon-1' }),
    displayName: z.string().openapi({ example: 'ねこ' }),
    avatarUrl: z.string().nullable().optional().openapi({ example: '/anonymous-profiles/cat.svg' }),
    avatarUrls: z
      .array(z.string())
      .optional()
      .openapi({ example: ['/anonymous-profiles/cat.svg'] }),
    // 質問・回答の公開レスポンス（Answer.anonymousProfile等）では省略される。管理画面の一覧でのみ使う
    isActive: z.boolean().optional().openapi({ example: true }),
    createdAt: dateTime().optional(),
  })
  .openapi('AnonymousProfile')

export const AnswerSchema = z
  .object({
    id: z.string().openapi({ example: 'answer-1' }),
    postId: z.string().openapi({ example: 'post-1' }),
    body: z.string().openapi({ example: 'App Router を使うのがおすすめです。' }),
    anonymousProfile: AnonymousProfileSchema,
    isHidden: z.boolean().openapi({ example: false }),
    likeCount: z.number().openapi({ example: 0 }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('Answer')

export const NotificationTypeSchema = z
  .enum([
    'MENTIONED',
    'POST_ANSWERED',
    'POST_LIKED',
    'ANSWER_LIKED',
    'HIROBA_POST_ANSWERED',
    'HIROBA_POST_LIKED',
    'HIROBA_ANSWER_LIKED',
    'POST_DELETED',
    'ANSWER_HIDDEN',
  ])
  .openapi('NotificationType')

export const MentionCandidateSchema = z
  .object({
    id: z.string().openapi({ example: 'user-1' }),
    displayName: z.string().openapi({ example: 'ねこ' }),
  })
  .openapi('MentionCandidate')

export const NotificationSchema = z
  .object({
    id: z.string().openapi({ example: 'notification-1' }),
    userId: z.string().openapi({ example: 'user-1' }),
    type: NotificationTypeSchema,
    postId: z.string().nullable().openapi({ example: 'post-1' }),
    post: z.union([PostSchema, z.null()]).optional(),
    answerId: z.string().nullable().openapi({ example: null }),
    answer: z.union([AnswerSchema, z.null()]).optional(),
    hirobaPostId: z.string().nullable().openapi({ example: null }),
    hirobaPost: z.union([HirobaPostSchema, z.null()]).optional(),
    hirobaAnswerId: z.string().nullable().openapi({ example: null }),
    hirobaAnswer: z.union([HirobaAnswerSchema, z.null()]).optional(),
    isRead: z.boolean().openapi({ example: false }),
    createdAt: dateTime(),
  })
  .openapi('Notification')

export const UnreadNotificationCountSchema = z
  .object({ count: z.number().int().openapi({ example: 3 }) })
  .openapi('UnreadNotificationCount')

export const LikeStatusSchema = z
  .object({
    liked: z.boolean().openapi({ example: true }),
    likeCount: z.number().openapi({ example: 1 }),
  })
  .openapi('LikeStatus')

export const SavedStatusSchema = z
  .object({
    saved: z.boolean().openapi({ example: true }),
    bookmarkCount: z.number().int().nonnegative().optional().openapi({ example: 1 }),
  })
  .openapi('SavedStatus')

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
    postId: z.string().nullable().openapi({ example: 'post-1' }),
    post: z.union([PostSchema, z.null()]).optional(),
    answerId: z.string().nullable().openapi({ example: null }),
    answer: z.union([AnswerSchema, z.null()]).optional(),
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
    error: z.string(),
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

/** パスパラメータ :slug */
export const SlugParamSchema = z.object({
  slug: z.string().openapi({ param: { name: 'slug', in: 'path' }, example: 'alcohol' }),
})

/** よく使うエラーレスポンス定義 */
export const errorResponse = (description: string, example: string) => ({
  description,
  content: {
    'application/json': {
      schema: ErrorSchema,
      example: { error: example },
    },
  },
})
