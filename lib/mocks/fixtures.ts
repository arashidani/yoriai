import {
  BadgeRarity,
  DisplayNameColor,
  FlagSeverity,
  FlagStatus,
  LunchPreference,
  NotificationType,
  QuestionStatus,
  Role,
} from '@/app/generated/prisma/enums'
import { HIROBA_CATALOG } from '@/lib/hiroba/catalog'

export const MOCK_USERS = [
  {
    id: 'user-1',
    supabaseId: 'supabase-user-1',
    email: 'dev@example.com',
    name: '開発者',
    username: 'みどりさん',
    role: Role.ADMIN,
    departmentId: 'department-1',
    businessAreaId: 'business-area-1',
    joinedYear: 2020,
    joinedMonth: 4,
    lunchPreference: LunchPreference.NO_PREFERENCE,
    recommendedLunchSpot: null,
    bio: 'よろしくお願いします',
    displayNameColor: DisplayNameColor.GREEN,
    avatarUrl: null,
    onboardingCompletedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    supabaseId: 'supabase-user-2',
    email: 'user@example.com',
    name: '一般ユーザー',
    username: 'あおさん',
    role: Role.USER,
    departmentId: 'department-2',
    businessAreaId: 'business-area-2',
    joinedYear: 2022,
    joinedMonth: 10,
    lunchPreference: LunchPreference.TEAM,
    recommendedLunchSpot: '駅前食堂',
    bio: null,
    displayNameColor: DisplayNameColor.BLUE,
    avatarUrl: null,
    onboardingCompletedAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-02'),
  },
]

export const MOCK_JOINED_HIROBA_SLUGS = [
  'alcohol',
  'photography',
  'two-dimensional',
  'gourmet',
  'outdoor',
] as const

export const MOCK_USER_PROFILE = {
  ...MOCK_USERS[0],
  businessSkillIds: ['business-skill-1'],
  interestIds: ['interest-1'],
}

/** アバターアップロードAPIのMOCK_MODE応答用 */
export const MOCK_AVATAR_URL = '/anonymous-profiles/cat.svg?v=mock'

const optionDates = {
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const MOCK_DEPARTMENTS = [
  { id: 'department-1', name: '開発部', isActive: true, ...optionDates },
  { id: 'department-2', name: '営業部', isActive: true, ...optionDates },
]

export const MOCK_BUSINESS_AREAS = [
  { id: 'business-area-1', name: 'プロダクト開発', isActive: true, ...optionDates },
  { id: 'business-area-2', name: '法人営業', isActive: true, ...optionDates },
]

export const MOCK_BUSINESS_SKILLS = [
  { id: 'business-skill-1', name: '社内ルール・手続き', isActive: true, ...optionDates },
  { id: 'business-skill-2', name: 'IT・ツール操作', isActive: true, ...optionDates },
  { id: 'business-skill-3', name: '業務スキル', isActive: true, ...optionDates },
  {
    id: 'business-skill-4',
    name: '顧客対応・コミュニケーション',
    isActive: true,
    ...optionDates,
  },
  { id: 'business-skill-5', name: 'IBJマインド・キャリア', isActive: true, ...optionDates },
]

export const MOCK_INTERESTS = [
  { id: 'interest-1', name: '生成AI', isActive: true, ...optionDates },
  { id: 'interest-2', name: '組織づくり', isActive: true, ...optionDates },
]

export const MOCK_ANONYMOUS_PROFILES = [
  {
    id: 'anon-1',
    displayName: 'ねこ',
    avatarUrl: '/anonymous-profiles/cat.svg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'anon-2',
    displayName: 'いぬ',
    avatarUrl: '/anonymous-profiles/dog.svg',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'anon-3',
    displayName: 'うさぎ',
    avatarUrl: '/anonymous-profiles/rabbit.svg',
    isActive: false,
    createdAt: new Date('2024-01-02'),
  },
]

export const MOCK_TAGS = [
  {
    id: 'tag-1',
    name: '勤怠・有給関連',
    category: '社内ルール・手続き',
    description:
      '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-2',
    name: '経費精算',
    category: '社内ルール・手続き',
    description:
      '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-3',
    name: '福利厚生',
    category: '社内ルール・手続き',
    description:
      '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-4',
    name: '社内設備',
    category: '社内ルール・手続き',
    description:
      '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-5',
    name: '社内ツール',
    category: 'IT・ツール操作',
    description:
      'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-6',
    name: 'Office（Excel等）',
    category: 'IT・ツール操作',
    description:
      'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-7',
    name: 'デザイナー向け',
    category: 'IT・ツール操作',
    description:
      'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-8',
    name: 'エンジニア向け',
    category: 'IT・ツール操作',
    description:
      'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-9',
    name: '一般IT知識',
    category: 'IT・ツール操作',
    description:
      'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-10',
    name: '営業・商談',
    category: '業務スキル',
    description:
      '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-11',
    name: '資料作成',
    category: '業務スキル',
    description:
      '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-12',
    name: '企画アイディア',
    category: '業務スキル',
    description:
      '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-13',
    name: 'タスク管理',
    category: '業務スキル',
    description:
      '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-14',
    name: 'データ分析',
    category: '業務スキル',
    description:
      '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-15',
    name: '仲間とのコミュニケーション',
    category: '顧客対応・コミュニケーション',
    description: null,
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-16',
    name: 'お客様とのコミュニケーション',
    category: '顧客対応・コミュニケーション',
    description: '対人関係や「IBJならでは」のソフトスキル。現場の最前線で働く人が答えやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-17',
    name: 'キャリア相談',
    category: 'IBJマインド・キャリア',
    description: '会社の文化や、マニュアル化しづらいこと。マスター層やマネージャー層が語りやすい。',
    isWorkTag: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-18',
    name: 'その他（雑談に近い質問）',
    category: 'その他',
    description: null,
    isWorkTag: false,
    createdAt: new Date('2024-01-01'),
  },
]

export const MOCK_TAG_CATEGORIES = [
  { id: 'tag-category-1', name: '社内ルール・手続き', createdAt: new Date('2024-01-01') },
  { id: 'tag-category-2', name: 'IT・ツール操作', createdAt: new Date('2024-01-01') },
  { id: 'tag-category-3', name: '業務スキル', createdAt: new Date('2024-01-01') },
  {
    id: 'tag-category-4',
    name: '顧客対応・コミュニケーション',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-category-5',
    name: 'IBJマインド・キャリア',
    createdAt: new Date('2024-01-01'),
  },
  { id: 'tag-category-6', name: 'その他', createdAt: new Date('2024-01-01') },
]

const MOCK_PUBLIC_TAGS = MOCK_TAGS.map(({ id, name, category, createdAt }) => ({
  id,
  name,
  category,
  createdAt,
}))

export const MOCK_POSTS = [
  {
    id: 'post-1',
    title: '有給休暇の申請方法を教えてください',
    body: '有給休暇を申請するときの社内手続きを知りたいです。',
    authorId: 'user-2',
    author: MOCK_USERS[1],
    postAnonymousProfile: { anonymousProfile: MOCK_ANONYMOUS_PROFILES[0] },
    status: QuestionStatus.OPEN,
    answerCount: 1,
    likeCount: 5,
    resolvedAt: null,
    deletedAt: null,
    tags: [MOCK_PUBLIC_TAGS[0]],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'post-2',
    title: '経費精算の申請期限を知りたい',
    body: '立替経費はいつまでに申請すればよいでしょうか？',
    authorId: 'user-1',
    author: MOCK_USERS[0],
    postAnonymousProfile: { anonymousProfile: MOCK_ANONYMOUS_PROFILES[1] },
    status: QuestionStatus.OPEN,
    answerCount: 0,
    likeCount: 0,
    resolvedAt: null,
    deletedAt: null,
    tags: [MOCK_PUBLIC_TAGS[1]],
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: 'post-3',
    title: '利用できる福利厚生を知りたい',
    body: '現在利用できる福利厚生制度を教えてください。',
    authorId: 'user-2',
    author: MOCK_USERS[1],
    postAnonymousProfile: { anonymousProfile: MOCK_ANONYMOUS_PROFILES[0] },
    status: QuestionStatus.RESOLVED,
    answerCount: 1,
    likeCount: 2,
    resolvedAt: new Date('2024-01-15'),
    deletedAt: null,
    tags: [MOCK_PUBLIC_TAGS[2], MOCK_PUBLIC_TAGS[1]],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'post-4',
    title: '会議室設備の使い方を知りたい',
    body: '会議室のモニターと社内ツールを接続する方法を教えてください。',
    authorId: 'user-2',
    author: MOCK_USERS[1],
    postAnonymousProfile: { anonymousProfile: MOCK_ANONYMOUS_PROFILES[1] },
    status: QuestionStatus.OPEN,
    answerCount: 0,
    likeCount: 0,
    resolvedAt: null,
    deletedAt: null,
    tags: [MOCK_PUBLIC_TAGS[0], MOCK_PUBLIC_TAGS[3]],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'post-5',
    title: 'どの小ジャンルにも当てはまらない質問',
    body: 'その他として分類された質問です。',
    authorId: 'user-2',
    author: MOCK_USERS[1],
    postAnonymousProfile: { anonymousProfile: MOCK_ANONYMOUS_PROFILES[2] },
    status: QuestionStatus.OPEN,
    answerCount: 0,
    likeCount: 0,
    resolvedAt: null,
    deletedAt: null,
    tags: [MOCK_PUBLIC_TAGS[17]],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'post-deleted',
    title: '削除済みの質問',
    body: 'AI判定によって論理削除された質問です。',
    authorId: 'user-2',
    author: MOCK_USERS[1],
    postAnonymousProfile: { anonymousProfile: MOCK_ANONYMOUS_PROFILES[0] },
    status: QuestionStatus.OPEN,
    answerCount: 0,
    likeCount: 0,
    resolvedAt: null,
    deletedAt: new Date('2024-01-14'),
    tags: [],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
]

/** MOCK の PostTag いずれかが tagId と一致するか。本番 Prisma の tags: { some: { tagId } } と同じ判定。 */
export function mockPostHasTagId(postId: string, tagId: string): boolean {
  const post = MOCK_POSTS.find((item) => item.id === postId)
  return post?.tags.some((tag) => tag.id === tagId) ?? false
}

export const MOCK_HIROBAS = HIROBA_CATALOG.map(({ id, slug, name, description }) => ({
  id,
  slug,
  name,
  description,
  createdAt: new Date('2024-01-01'),
}))

export const MOCK_HIROBA_POSTS = [
  {
    id: 'hiroba-post-1',
    hirobaId: 'hiroba-alcohol',
    title: '今日のランチどこ行きました？',
    body: '近くに新しくできたお店に行ってみたら、とても美味しかったです。',
    imageUrl: null,
    authorId: 'user-2',
    author: MOCK_USERS[1],
    answerCount: 1,
    likeCount: 2,
    deletedAt: null,
    tags: [MOCK_PUBLIC_TAGS[14]],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'hiroba-post-2',
    hirobaId: 'hiroba-alcohol',
    title: 'おすすめの本を教えてください',
    body: '最近読んで面白かった本があれば教えてほしいです。',
    imageUrl: null,
    authorId: 'user-1',
    author: MOCK_USERS[0],
    answerCount: 0,
    likeCount: 0,
    deletedAt: null,
    tags: [],
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
  },
]

export const MOCK_HIROBA_ANSWERS = [
  {
    id: 'hiroba-answer-1',
    hirobaPostId: 'hiroba-post-1',
    authorId: 'user-1',
    author: MOCK_USERS[0],
    body: 'いいですね、今度行ってみます！',
    isHidden: false,
    likeCount: 1,
    createdAt: new Date('2024-01-20T01:00:00Z'),
    updatedAt: new Date('2024-01-20T01:00:00Z'),
  },
]

export const MOCK_ANSWERS = [
  {
    id: 'answer-1',
    postId: 'post-1',
    authorId: 'user-2',
    body: 'App Router を使うのがおすすめです。今後の新機能は App Router 中心に追加されます。',
    anonymousProfile: MOCK_ANONYMOUS_PROFILES[0],
    isHidden: false,
    likeCount: 3,
    createdAt: new Date('2024-01-10T01:00:00Z'),
    updatedAt: new Date('2024-01-10T01:00:00Z'),
  },
  {
    id: 'answer-2',
    postId: 'post-3',
    authorId: 'user-1',
    body: '`relation` フィールドと外部キーを使えば1対多を表現できます。',
    anonymousProfile: MOCK_ANONYMOUS_PROFILES[1],
    isHidden: false,
    likeCount: 1,
    createdAt: new Date('2024-01-12T02:00:00Z'),
    updatedAt: new Date('2024-01-12T02:00:00Z'),
  },
]

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notification-1',
    userId: 'user-1',
    type: NotificationType.POST_ANSWERED,
    postId: 'post-2',
    post: MOCK_POSTS[1],
    answerId: null,
    answer: null,
    hirobaPostId: null,
    hirobaPost: null,
    hirobaAnswerId: null,
    hirobaAnswer: null,
    isRead: false,
    createdAt: new Date('2024-01-14T00:00:00Z'),
  },
  {
    id: 'notification-2',
    userId: 'user-1',
    type: NotificationType.ANSWER_HIDDEN,
    postId: null,
    post: null,
    answerId: 'answer-2',
    answer: { ...MOCK_ANSWERS[1], isHidden: true },
    hirobaPostId: null,
    hirobaPost: null,
    hirobaAnswerId: null,
    hirobaAnswer: null,
    isRead: true,
    createdAt: new Date('2024-01-13T00:00:00Z'),
  },
  {
    id: 'notification-3',
    userId: 'user-2',
    type: NotificationType.POST_ANSWERED,
    postId: 'post-1',
    post: MOCK_POSTS[0],
    answerId: null,
    answer: null,
    hirobaPostId: null,
    hirobaPost: null,
    hirobaAnswerId: null,
    hirobaAnswer: null,
    isRead: false,
    createdAt: new Date('2024-01-12T00:00:00Z'),
  },
]

export const MOCK_BADGES = [
  {
    id: 'badge-1',
    name: '初投稿',
    description: '初めて投稿を作成した',
    icon: 'Medal',
    rarity: BadgeRarity.BRONZE,
    earnedCount: 842,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'badge-2',
    name: '質問マスター',
    description: '質問を50件投稿した',
    icon: 'Award',
    rarity: BadgeRarity.SILVER,
    earnedCount: 213,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'badge-3',
    name: 'ベストアンサー王',
    description: 'ベストアンサーを100件獲得した',
    icon: 'Crown',
    rarity: BadgeRarity.GOLD,
    earnedCount: 34,
    createdAt: new Date('2024-01-03'),
  },
  {
    id: 'badge-4',
    name: '伝説の回答者',
    description: '累計いいねを1000件獲得した',
    icon: 'Sparkles',
    rarity: BadgeRarity.PLATINUM,
    earnedCount: 5,
    createdAt: new Date('2024-01-04'),
  },
]

export const MOCK_MISSIONS = [
  {
    id: 'mission-1',
    name: '3日連続ログイン',
    description: '3日間連続でログインする',
    durationLabel: '3日間',
    targetCount: 3,
    active: true,
    participantsCount: 421,
    progressPercent: 100,
    rewardBadgeId: 'badge-1',
    rewardBadge: MOCK_BADGES[0],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'mission-2',
    name: '週に5件投稿',
    description: '1週間で5件の投稿を作成する',
    durationLabel: '1週間',
    targetCount: 5,
    active: true,
    participantsCount: 189,
    progressPercent: 62,
    rewardBadgeId: 'badge-2',
    rewardBadge: MOCK_BADGES[1],
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'mission-3',
    name: 'コメントを10件つける',
    description: '他のユーザーの投稿にコメントする',
    durationLabel: '1週間',
    targetCount: 10,
    active: true,
    participantsCount: 97,
    progressPercent: 34,
    rewardBadgeId: null,
    rewardBadge: null,
    createdAt: new Date('2024-01-03'),
  },
  {
    id: 'mission-4',
    name: '月間トップ回答者',
    description: '月内で最も多くベストアンサーを獲得する',
    durationLabel: '1ヶ月',
    targetCount: 1,
    active: false,
    participantsCount: 26,
    progressPercent: 8,
    rewardBadgeId: 'badge-3',
    rewardBadge: MOCK_BADGES[2],
    createdAt: new Date('2024-01-04'),
  },
]

export const MOCK_AI_FLAGS = [
  {
    id: 'flag-1',
    title: '不適切な投稿の可能性: 有給休暇の申請方法を教えてください',
    detail: '投稿内に、脅迫・ハラスメントとみられる表現が含まれています',
    severity: FlagSeverity.HIGH,
    status: FlagStatus.UNREAD,
    targetUserId: 'user-1',
    targetUser: MOCK_USERS[0],
    postId: 'post-1',
    post: MOCK_POSTS[0],
    answerId: null,
    answer: null,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'flag-2',
    title: '個人情報の投稿を検出',
    detail: 'コメント内に電話番号のようなパターンが含まれています',
    severity: FlagSeverity.MEDIUM,
    status: FlagStatus.UNREAD,
    targetUserId: 'user-2',
    targetUser: MOCK_USERS[1],
    postId: null,
    post: null,
    answerId: null,
    answer: null,
    createdAt: new Date('2024-01-11'),
  },
  {
    id: 'flag-3',
    title: '短時間での連続投稿',
    detail: '5分間に8件の投稿を検出しました。スパムの可能性があります',
    severity: FlagSeverity.MEDIUM,
    status: FlagStatus.CONFIRMED,
    targetUserId: 'user-2',
    targetUser: MOCK_USERS[1],
    postId: null,
    post: null,
    answerId: null,
    answer: null,
    createdAt: new Date('2024-01-12'),
  },
  {
    id: 'flag-4',
    title: '不審なログイン試行',
    detail: '通常と異なる地域からのログインを検出しました',
    severity: FlagSeverity.HIGH,
    status: FlagStatus.CONFIRMED,
    targetUserId: 'user-1',
    targetUser: MOCK_USERS[0],
    postId: null,
    post: null,
    answerId: null,
    answer: null,
    createdAt: new Date('2024-01-13'),
  },
]

export const MOCK_INVITES = [
  {
    id: 'invite-1',
    token: 'mock-invite-token',
    name: '招待ユーザー（仮）',
    role: Role.USER,
    expiresAt: new Date('2099-01-01'),
    usedAt: null,
    createdAt: new Date('2024-01-01'),
  },
]

export const MOCK_PASSWORD_RESETS = [
  {
    id: 'password-reset-1',
    token: 'mock-password-reset-token',
    userId: 'user-2',
    expiresAt: new Date('2099-01-01'),
    usedAt: null,
    createdAt: new Date('2024-01-01'),
  },
]

export const MOCK_CHAT_CONVERSATION_ID = 'mock-conversation'

export function getMockChatResponseChunks(query: string) {
  return [`「${query}」`, 'についてのモック回答です。', '\n\nMOCK_MODEで動作中。']
}
