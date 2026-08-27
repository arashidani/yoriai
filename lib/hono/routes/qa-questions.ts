import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { Prisma } from '@/app/generated/prisma/client'
import { FlagSeverity, NotificationType, QuestionStatus } from '@/app/generated/prisma/enums'
import { scheduleAfterResponse } from '@/lib/hono/after-response'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  AnswerableQuestionSchema,
  ModerationResultSchema,
  PageQuerySchema,
  QaAnswerSchema,
  QuestionDetailResponseSchema,
  QuestionListQuerySchema,
  QuestionListResponseSchema,
  QuestionSchema,
  QuestionTagCategorySchema,
  QuestionTagSchema,
  TagAssignmentStatusSchema,
} from '@/lib/hono/openapi/qa-schemas'
import {
  errorResponse,
  IdParamSchema,
  LikeStatusSchema,
  MentionCandidateSchema,
  SavedStatusSchema,
} from '@/lib/hono/openapi/schemas'
import { hasBodyMention } from '@/lib/mentions/has-body-mention'
import {
  MOCK_ANSWERS,
  MOCK_BUSINESS_SKILLS,
  MOCK_POSTS,
  MOCK_TAG_CATEGORIES,
  MOCK_TAGS,
  MOCK_USER_PROFILE,
  mockPostHasTagId,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { anonymousProfileDisplayName } from '@/lib/questions/anonymous-profile-display'
import {
  getMostLikedAnswerId,
  toAnswerableQuestionResponse,
  toQaAnswerResponse,
  toQuestionResponse,
} from '@/lib/questions/api-mappers'
import { getOrAssignAnonymousProfile } from '@/lib/questions/assign-anonymous-profile'
import { selectAnswerableQuestions } from '@/lib/questions/select-answerable-questions'
import { createAnswerSchema } from '@/lib/schemas/answer'
import { assignQuestionTagSchema, createPostSchema } from '@/lib/schemas/post'

const auth = {
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware],
}

const questionInclude = (userId: string) => ({
  author: { select: { name: true, email: true } },
  postAnonymousProfile: {
    select: {
      aliasNumber: true,
      anonymousProfile: { select: { displayName: true, avatarUrls: true } },
    },
  },
  tags: {
    select: {
      id: true,
      createdAt: true,
      tag: {
        select: {
          id: true,
          name: true,
          category: true,
          categoryDefinition: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
  },
  likes: { where: { userId }, select: { userId: true } },
  bookmarks: { where: { userId }, select: { userId: true } },
})

function pagination(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) }
}

function commaSeparatedIds(value?: string) {
  return (
    value
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean) ?? []
  )
}

async function getQaMentionCandidates(postId: string) {
  if (process.env.MOCK_MODE === 'true') {
    const post = MOCK_POSTS.find((item) => item.id === postId)
    if (!post || post.deletedAt) return null
    const participants = [
      ...MOCK_ANSWERS.filter((answer) => answer.postId === postId && !answer.isHidden).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
      post,
    ]
    const seen = new Set<string>()
    return participants.flatMap((participant) => {
      if (!participant.authorId || seen.has(participant.authorId)) return []
      seen.add(participant.authorId)
      const profile =
        'anonymousProfile' in participant
          ? participant.anonymousProfile
          : participant.postAnonymousProfile?.anonymousProfile
      return profile
        ? [
            {
              id: `mock-assignment-${participant.id}`,
              displayName: anonymousProfileDisplayName(profile.displayName, 1),
              userId: participant.authorId,
            },
          ]
        : []
    })
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
    select: {
      authorId: true,
      postAnonymousProfile: { include: { anonymousProfile: true } },
      answers: {
        where: { isHidden: false, authorId: { not: null } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          authorId: true,
          postAnonymousProfile: { include: { anonymousProfile: true } },
        },
      },
    },
  })
  if (!post) return null

  const seen = new Set<string>()
  const add = (
    userId: string | null,
    assignment: {
      id: string
      anonymousProfile: { displayName: string }
      aliasNumber: number
    } | null,
  ) => {
    if (!userId || !assignment || seen.has(userId)) return []
    seen.add(userId)
    return [
      {
        id: assignment.id,
        displayName: anonymousProfileDisplayName(
          assignment.anonymousProfile.displayName,
          assignment.aliasNumber,
        ),
        userId,
      },
    ]
  }
  return [
    ...post.answers.flatMap((answer) => add(answer.authorId, answer.postAnonymousProfile)),
    ...add(post.authorId, post.postAnonymousProfile),
  ]
}

function mockQuestions(viewerId: string) {
  return MOCK_POSTS.filter((post) => !post.deletedAt).map((post) =>
    toQuestionResponse(
      {
        ...post,
        activityAt: MOCK_ANSWERS.filter((answer) => answer.postId === post.id).reduce(
          (latest, answer) => (answer.createdAt > latest ? answer.createdAt : latest),
          post.createdAt,
        ),
        tags: post.tags.map((tag, index) => ({
          id: `mock-post-tag-${post.id}-${index}`,
          createdAt: new Date(post.createdAt.getTime() + index),
          tag: {
            ...tag,
            categoryDefinition: MOCK_TAG_CATEGORIES.find(
              (category) => category.name === tag.category,
            ),
          },
        })),
        likes: [],
        bookmarks: [],
      },
      viewerId,
    ),
  )
}

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['questions'],
  summary: '質問一覧を検索・絞り込み・ページングして取得',
  ...auth,
  request: { query: QuestionListQuerySchema },
  responses: {
    200: {
      description: '質問一覧',
      content: { 'application/json': { schema: QuestionListResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const answerableRoute = createRoute({
  method: 'get',
  path: '/answerable',
  tags: ['questions'],
  summary: 'ログインユーザーが回答できそうな質問をランダム取得',
  ...auth,
  responses: {
    200: {
      description: 'ビジネススキル関連を優先し、「その他」で最大3件まで補完した質問',
      content: {
        'application/json': {
          schema: z.object({ questions: z.array(AnswerableQuestionSchema).max(3) }),
        },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['questions'],
  summary: '質問詳細を取得',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '質問詳細',
      content: { 'application/json': { schema: QuestionDetailResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const listAnswersRoute = createRoute({
  method: 'get',
  path: '/{id}/answers',
  tags: ['questions'],
  summary: '回答一覧を取得。募集終了済みの場合だけ最多いいね回答1件を示す',
  deprecated: true,
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '回答一覧',
      content: { 'application/json': { schema: z.object({ answers: z.array(QaAnswerSchema) }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const mentionCandidatesRoute = createRoute({
  method: 'get',
  path: '/{id}/mention-candidates',
  tags: ['questions'],
  summary: '質問スレッドでメンションできる匿名参加者を最新の回答順で取得',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'メンション候補',
      content: {
        'application/json': { schema: z.object({ candidates: z.array(MentionCandidateSchema) }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

const createQuestionRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['questions'],
  summary: '質問を作成',
  ...auth,
  request: {
    headers: z.object({
      'idempotency-key': z
        .string()
        .uuid()
        .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    }),
    body: { required: true, content: { 'application/json': { schema: createPostSchema } } },
  },
  responses: {
    201: {
      description: '作成成功',
      content: {
        'application/json': {
          schema: z.object({
            question: QuestionSchema,
            moderation: ModerationResultSchema,
            tagAssignment: TagAssignmentStatusSchema,
          }),
        },
      },
    },
    200: {
      description: '同一内容の再送',
      content: {
        'application/json': {
          schema: z.object({
            question: QuestionSchema,
            moderation: ModerationResultSchema,
            tagAssignment: TagAssignmentStatusSchema,
          }),
        },
      },
    },
    400: errorResponse('不正なタグ', '選択されたタグが見つかりません'),
    401: errorResponse('未認証', 'Unauthorized'),
    409: errorResponse('同じキーで異なる内容', '同じ投稿操作に異なる内容が指定されています'),
    500: errorResponse('作成失敗', '投稿の作成に失敗しました'),
  },
})

const assignTagRoute = createRoute({
  method: 'post',
  path: '/{id}/tag-assignment',
  tags: ['questions'],
  summary: '質問へタグを付与（AI再試行または手動選択）',
  ...auth,
  request: {
    params: IdParamSchema,
    body: { required: true, content: { 'application/json': { schema: assignQuestionTagSchema } } },
  },
  responses: {
    200: {
      description: 'タグ付与成功',
      content: { 'application/json': { schema: z.object({ tag: QuestionTagSchema }) } },
    },
    400: errorResponse('不正なタグ', '選択されたタグが見つかりません'),
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('質問者以外', 'Forbidden'),
    404: errorResponse('質問が見つからない', 'Not found'),
    409: errorResponse('操作不可', 'この質問にはタグを付与できません'),
    422: errorResponse('AIが有効なタグを選べない', 'AIによるタグ付与に失敗しました'),
    429: errorResponse('AIレート制限', 'AIによるタグ付与に失敗しました'),
    502: errorResponse('AI通信失敗', 'AIによるタグ付与に失敗しました'),
    503: errorResponse('AIサービス利用不可', 'AIによるタグ付与に失敗しました'),
    504: errorResponse('AIタイムアウト', 'AIによるタグ付与に失敗しました'),
  },
})

const createAnswerRoute = createRoute({
  method: 'post',
  path: '/{id}/answers',
  tags: ['questions'],
  summary: '質問へ回答を投稿',
  ...auth,
  request: {
    params: IdParamSchema,
    headers: z.object({ 'idempotency-key': z.string().uuid() }),
    body: { required: true, content: { 'application/json': { schema: createAnswerSchema } } },
  },
  responses: {
    201: {
      description: '作成成功',
      content: {
        'application/json': {
          schema: z.object({ answer: QaAnswerSchema, moderation: ModerationResultSchema }),
        },
      },
    },
    200: {
      description: '同一内容の再送',
      content: {
        'application/json': {
          schema: z.object({ answer: QaAnswerSchema, moderation: ModerationResultSchema }),
        },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    400: errorResponse('メンション対象が不正', 'このスレッドの参加者のみメンションできます'),
    404: errorResponse('質問が存在しない', '投稿が見つかりません'),
    410: errorResponse('質問が削除済み', 'この投稿は削除されたため、回答できません'),
    409: errorResponse('回答受付終了', '回答を受け付けていない質問です'),
    500: errorResponse('作成失敗', '回答の作成に失敗しました'),
  },
})

const resolveRoute = createRoute({
  method: 'post',
  path: '/{id}/resolve',
  tags: ['questions'],
  summary: '質問の募集を終了',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '募集終了',
      content: { 'application/json': { schema: z.object({ question: QuestionSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('質問者以外', 'Forbidden'),
    404: errorResponse('質問が見つからない', 'Not found'),
    409: errorResponse('操作不可', '操作できない質問の状態です'),
  },
})

const likeRoute = createRoute({
  method: 'post',
  path: '/{id}/likes',
  tags: ['questions'],
  summary: '質問に足跡を付ける',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '足跡状態', content: { 'application/json': { schema: LikeStatusSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('自分の質問', '自分の質問にはいいねできません'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('処理失敗', 'いいねの処理に失敗しました'),
  },
})

const unlikeRoute = createRoute({
  method: 'delete',
  path: '/{id}/likes',
  tags: ['questions'],
  summary: '質問の足跡を取り消す',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: { description: '足跡状態', content: { 'application/json': { schema: LikeStatusSchema } } },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('処理失敗', 'いいね取り消しの処理に失敗しました'),
  },
})

const bookmarkRoute = createRoute({
  method: 'post',
  path: '/{id}/bookmarks',
  tags: ['questions'],
  summary: '質問を保存',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
    500: errorResponse('処理失敗', '保存の処理に失敗しました'),
  },
})

const unbookmarkRoute = createRoute({
  method: 'delete',
  path: '/{id}/bookmarks',
  tags: ['questions'],
  summary: '質問の保存を取り消す',
  ...auth,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '保存状態',
      content: { 'application/json': { schema: SavedStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('質問が見つからない', 'Not found'),
  },
})

export const qaQuestionsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(mentionCandidatesRoute, async (c) => {
    const { id } = c.req.valid('param')
    const candidates = await getQaMentionCandidates(id)
    if (!candidates) return c.json({ error: 'Not found' }, 404)
    return c.json(
      { candidates: candidates.map(({ id, displayName }) => ({ id, displayName })) },
      200,
    )
  })
  .openapi(listRoute, async (c) => {
    const user = c.get('user')
    const { page, pageSize, keyword, status, tagId, categoryIds, tagIds } = c.req.valid('query')
    const selectedCategoryIds = commaSeparatedIds(categoryIds)
    const selectedTagIds = commaSeparatedIds(tagIds)
    if (process.env.MOCK_MODE === 'true') {
      let questions = mockQuestions(user.id)
      if (keyword)
        questions = questions.filter((q) => q.title.includes(keyword) || q.body.includes(keyword))
      if (status === 'unanswered')
        questions = questions.filter((q) => q.status === QuestionStatus.OPEN)
      if (status === 'resolved')
        questions = questions.filter((q) => q.status === QuestionStatus.RESOLVED)
      if (tagId) questions = questions.filter((q) => mockPostHasTagId(q.id, tagId))
      if (selectedCategoryIds.length > 0 || selectedTagIds.length > 0) {
        const selectedCategoryNames = MOCK_TAG_CATEGORIES.filter((category) =>
          selectedCategoryIds.includes(category.id),
        ).map((category) => category.name)
        const matchingPostIds = MOCK_POSTS.filter((post) =>
          post.tags.some(
            (tag) =>
              selectedTagIds.includes(tag.id) || selectedCategoryNames.includes(tag.category),
          ),
        ).map((post) => post.id)
        questions = questions.filter((question) => matchingPostIds.includes(question.id))
      }
      questions.sort(
        (a, b) => b.activityAt.getTime() - a.activityAt.getTime() || b.id.localeCompare(a.id),
      )
      const total = questions.length
      return c.json(
        {
          questions: questions.slice((page - 1) * pageSize, page * pageSize),
          pagination: pagination(page, pageSize, total),
        },
        200,
      )
    }

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      status:
        status === 'unanswered'
          ? QuestionStatus.OPEN
          : status === 'resolved'
            ? QuestionStatus.RESOLVED
            : { in: [QuestionStatus.OPEN, QuestionStatus.RESOLVED] },
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { body: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(tagId
        ? { tags: { some: { tagId } } }
        : selectedCategoryIds.length > 0 || selectedTagIds.length > 0
          ? {
              tags: {
                some: {
                  tag: {
                    OR: [
                      ...(selectedTagIds.length > 0 ? [{ id: { in: selectedTagIds } }] : []),
                      ...(selectedCategoryIds.length > 0
                        ? [{ categoryDefinition: { id: { in: selectedCategoryIds } } }]
                        : []),
                    ],
                  },
                },
              },
            }
          : {}),
    }
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: questionInclude(user.id),
        orderBy: [{ activityAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])
    return c.json(
      {
        questions: posts.map((post) => toQuestionResponse(post, user.id)),
        pagination: pagination(page, pageSize, total),
      },
      200,
    )
  })
  .openapi(answerableRoute, async (c) => {
    const user = c.get('user')
    c.header('Cache-Control', 'no-store')

    if (process.env.MOCK_MODE === 'true') {
      const businessSkillNames = MOCK_BUSINESS_SKILLS.filter((skill) =>
        MOCK_USER_PROFILE.businessSkillIds.includes(skill.id),
      ).map((skill) => skill.name)
      const candidates = mockQuestions(user.id).filter(
        (question) => question.status === QuestionStatus.OPEN && !question.isOwnQuestion,
      )
      const postById = new Map(MOCK_POSTS.map((post) => [post.id, post]))
      const skillQuestions = candidates.filter((question) =>
        postById.get(question.id)?.tags.some((tag) => businessSkillNames.includes(tag.category)),
      )
      const otherQuestions = candidates.filter((question) =>
        postById.get(question.id)?.tags.some((tag) => tag.name.startsWith('その他')),
      )

      const questions = selectAnswerableQuestions(skillQuestions, otherQuestions).map(
        ({ id, title, displayAuthor }) => ({ id, title, displayAuthor }),
      )
      return c.json({ questions }, 200)
    }

    const businessSkillNames = (
      await prisma.userBusinessSkill.findMany({
        where: { userId: user.id },
        select: { businessSkill: { select: { name: true } } },
      })
    ).map(({ businessSkill }) => businessSkill.name)
    const baseWhere: Prisma.PostWhereInput = {
      deletedAt: null,
      status: QuestionStatus.OPEN,
      OR: [{ authorId: null }, { authorId: { not: user.id } }],
    }
    const [skillQuestions, otherQuestions] = await Promise.all([
      businessSkillNames.length === 0
        ? []
        : prisma.post.findMany({
            where: {
              ...baseWhere,
              tags: {
                some: {
                  tag: { category: { in: businessSkillNames } },
                },
              },
            },
            select: { id: true },
          }),
      prisma.post.findMany({
        where: { ...baseWhere, tags: { some: { tag: { name: { startsWith: 'その他' } } } } },
        select: { id: true },
      }),
    ])
    const selected = selectAnswerableQuestions(skillQuestions, otherQuestions)
    if (selected.length === 0) return c.json({ questions: [] }, 200)

    const posts = await prisma.post.findMany({
      where: { id: { in: selected.map(({ id }) => id) } },
      select: {
        id: true,
        title: true,
        postAnonymousProfile: { include: { anonymousProfile: true } },
      },
    })
    const postById = new Map(posts.map((post) => [post.id, post]))
    const questions = selected.flatMap(({ id }) => {
      const post = postById.get(id)
      return post ? [toAnswerableQuestionResponse(post)] : []
    })

    return c.json({ questions }, 200)
  })
  .openapi(getRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const question = mockQuestions(user.id).find((item) => item.id === id)
      if (!question) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_ANSWERS.filter(
        (answer) => answer.postId === id && !answer.isHidden,
      ).sort(
        (a, b) =>
          b.likeCount - a.likeCount ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id),
      )
      const mostLikedId = getMostLikedAnswerId(question.status, answers)
      return c.json(
        {
          question,
          answers: answers.map((answer) =>
            toQaAnswerResponse({ ...answer, likes: [] }, user.id, mostLikedId),
          ),
        },
        200,
      )
    }
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
      include: {
        ...questionInclude(user.id),
        answers: {
          where: { isHidden: false },
          include: {
            author: true,
            postAnonymousProfile: { include: { anonymousProfile: true } },
            likes: { where: { userId: user.id }, select: { userId: true } },
          },
          orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    const mostLikedId = getMostLikedAnswerId(post.status, post.answers)
    return c.json(
      {
        question: toQuestionResponse(post, user.id),
        answers: post.answers.map((answer) => toQaAnswerResponse(answer, user.id, mostLikedId)),
      },
      200,
    )
  })
  .openapi(listAnswersRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((item) => item.id === id && !item.deletedAt)
      if (!post) return c.json({ error: 'Not found' }, 404)
      const answers = MOCK_ANSWERS.filter(
        (answer) => answer.postId === id && !answer.isHidden,
      ).sort(
        (a, b) =>
          b.likeCount - a.likeCount ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id),
      )
      const mostLikedId = getMostLikedAnswerId(post.status, answers)
      return c.json(
        {
          answers: answers.map((answer) =>
            toQaAnswerResponse({ ...answer, likes: [] }, user.id, mostLikedId),
          ),
        },
        200,
      )
    }
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
      select: { status: true },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    const answers = await prisma.answer.findMany({
      where: { postId: id, isHidden: false },
      include: {
        author: true,
        postAnonymousProfile: { include: { anonymousProfile: true } },
        likes: { where: { userId: user.id }, select: { userId: true } },
      },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    })
    const mostLikedId = getMostLikedAnswerId(post.status, answers)
    return c.json(
      { answers: answers.map((answer) => toQaAnswerResponse(answer, user.id, mostLikedId)) },
      200,
    )
  })
  .openapi(createQuestionRoute, async (c) => {
    const user = c.get('user')
    const data = c.req.valid('json')
    const { tagId, ...postData } = data
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')
    if (tagId) {
      if (process.env.MOCK_MODE === 'true') {
        if (!MOCK_TAGS.some((tag) => tag.id === tagId)) {
          return c.json({ error: '指定されたタグが見つかりません' }, 400)
        }
      } else {
        const selected = await prisma.tag.findUnique({ where: { id: tagId } })
        if (!selected) return c.json({ error: '指定されたタグが見つかりません' }, 400)
      }
    }
    if (process.env.MOCK_MODE === 'true') {
      const selectedTag = tagId
        ? MOCK_TAGS.find((tag) => tag.id === tagId && tag.isWorkTag)
        : undefined
      if (tagId && !selectedTag) return c.json({ error: '選択されたタグが見つかりません' }, 400)
      const tagAssignment: 'assigned' | 'failed' = selectedTag ? 'assigned' : 'failed'
      return c.json(
        {
          question: toQuestionResponse(
            {
              id: `post-${Date.now()}`,
              ...postData,
              authorId: user.id,
              author: user,
              status: QuestionStatus.OPEN,
              answerCount: 0,
              likeCount: 0,
              resolvedAt: null,
              tags: selectedTag
                ? [
                    {
                      id: `manual-${selectedTag.id}`,
                      createdAt: new Date(),
                      tag: {
                        ...selectedTag,
                        categoryDefinition: MOCK_TAG_CATEGORIES.find(
                          (category) => category.name === selectedTag.category,
                        ),
                      },
                    },
                  ]
                : [],
              likes: [],
              bookmarks: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            user.id,
          ),
          moderation: { isHidden: false },
          tagAssignment,
        },
        201,
      )
    }
    const manualTag = tagId
      ? await prisma.tag.findUnique({
          where: { id: tagId, isWorkTag: true },
          select: {
            id: true,
            name: true,
            category: true,
            categoryDefinition: true,
            description: true,
            createdAt: true,
          },
        })
      : null
    if (tagId && !manualTag) return c.json({ error: '選択されたタグが見つかりません' }, 400)
    // biome-ignore lint/suspicious/noExplicitAny: Prisma result variants share one variable
    let post: any
    try {
      post = await prisma.post.create({
        data: { ...postData, authorId: user.id, idempotencyKey },
        include: { author: true },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
        return c.json({ error: '投稿の作成に失敗しました' }, 500)
      const existing = await prisma.post.findUnique({
        where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
        include: { author: true, tags: { include: { tag: true } } },
      })
      if (!existing) return c.json({ error: '投稿の作成に失敗しました' }, 500)
      if (existing.title !== data.title || existing.body !== data.body)
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      const tagAssignment: 'assigned' | 'failed' | 'skipped' =
        existing.deletedAt || (existing.tags?.length ?? 0) > 0
          ? (existing.tags?.length ?? 0) > 0
            ? 'assigned'
            : 'skipped'
          : 'failed'
      return c.json(
        {
          question: toQuestionResponse(existing, user.id),
          moderation: { isHidden: Boolean(existing.deletedAt) },
          tagAssignment,
        },
        200,
      )
    }
    try {
      const assignment = await getOrAssignAnonymousProfile(post.id, user.id)
      post = await prisma.post.update({
        where: { id: post.id },
        data: { postAnonymousProfileId: assignment.id },
        include: { author: true },
      })
    } catch (error) {
      console.error('Failed to assign anonymous profile', { postId: post.id, error })
    }
    const { moderatePost } = await import('@/lib/ai/moderate-post')
    const moderation = await moderatePost(post.title, post.body)
    if (moderation?.flagged) {
      try {
        const [, flagged] = await prisma.$transaction([
          prisma.aiFlag.create({
            data: {
              title: `不適切な投稿の可能性: ${post.title}`,
              detail: moderation.reason,
              severity: FlagSeverity[moderation.severity],
              targetUserId: user.id,
              postId: post.id,
            },
          }),
          prisma.post.update({
            where: { id: post.id },
            data: { deletedAt: new Date() },
            include: { author: true },
          }),
        ])
        post = flagged
      } catch (error) {
        console.error('Failed to create AI flag', { postId: post.id, error })
      }
    }
    // biome-ignore lint/suspicious/noExplicitAny: temporary PostTag include shape
    let tags: any[] = []
    let tagAssignment: 'assigned' | 'failed' | 'skipped' = post.deletedAt ? 'skipped' : 'failed'
    if (!post.deletedAt) {
      try {
        let selected = manualTag
        if (!selected) {
          const allTags = await prisma.tag.findMany({
            where: { isWorkTag: true },
            select: {
              id: true,
              name: true,
              category: true,
              categoryDefinition: true,
              description: true,
              createdAt: true,
            },
          })
          const { assignTagsWithStatus } = await import('@/lib/ai/assign-tags')
          const assignment = await assignTagsWithStatus(post.title, post.body, allTags)
          tagAssignment = assignment.status === 'assigned' ? 'assigned' : 'failed'
          selected =
            assignment.status === 'assigned'
              ? (allTags.find((tag) => tag.name === assignment.tagNames[0]) ?? null)
              : null
        }
        if (selected) {
          await prisma.postTag.createMany({
            data: [{ postId: post.id, tagId: selected.id }],
            skipDuplicates: true,
          })
          tags = [{ id: `assigned-${selected.id}`, createdAt: selected.createdAt, tag: selected }]
          tagAssignment = 'assigned'
        }
      } catch (error) {
        console.error('Failed to assign tags', { postId: post.id, error })
        tagAssignment = 'failed'
      }
    }
    return c.json(
      {
        question: toQuestionResponse({ ...post, tags }, user.id),
        moderation: { isHidden: Boolean(post.deletedAt) },
        tagAssignment,
      },
      201,
    )
  })
  .openapi(assignTagRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((item) => item.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      const tag =
        input.mode === 'manual'
          ? MOCK_TAGS.find((item) => item.id === input.tagId && item.isWorkTag)
          : MOCK_TAGS.find((item) => item.isWorkTag)
      if (!tag) {
        if (input.mode === 'manual') return c.json({ error: '選択されたタグが見つかりません' }, 400)
        return c.json({ error: 'AIによるタグ付与に失敗しました' }, 422)
      }
      return c.json({ tag: { id: tag.id, name: tag.name } }, 200)
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        authorId: true,
        deletedAt: true,
        status: true,
        tags: { select: { tag: { select: { id: true, name: true } } }, take: 1 },
      },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
    if (post.deletedAt || post.status === QuestionStatus.HIDDEN)
      return c.json({ error: 'この質問にはタグを付与できません' }, 409)
    const existingTag = post.tags[0]?.tag
    if (existingTag) return c.json({ tag: existingTag }, 200)

    const candidates = await prisma.tag.findMany({
      where: {
        isWorkTag: true,
        ...(input.mode === 'manual' ? { id: input.tagId } : {}),
      },
      select: { id: true, name: true, category: true, description: true },
    })
    if (input.mode === 'manual' && candidates.length === 0)
      return c.json({ error: '選択されたタグが見つかりません' }, 400)

    let selected: (typeof candidates)[number] | null = candidates[0] ?? null
    if (input.mode === 'ai') {
      const { assignTagsWithStatus, toTagAssignmentErrorStatus } = await import(
        '@/lib/ai/assign-tags'
      )
      const assignment = await assignTagsWithStatus(post.title, post.body, candidates)
      if (assignment.status !== 'assigned')
        return c.json(
          { error: 'AIによるタグ付与に失敗しました' },
          toTagAssignmentErrorStatus(assignment),
        )
      selected = candidates.find((tag) => tag.name === assignment.tagNames[0]) ?? null
      if (!selected) return c.json({ error: 'AIによるタグ付与に失敗しました' }, 422)
    }

    if (!selected) return c.json({ error: '選択されたタグが見つかりません' }, 400)

    await prisma.postTag.createMany({
      data: [{ postId: post.id, tagId: selected.id }],
      skipDuplicates: true,
    })
    return c.json({ tag: { id: selected.id, name: selected.name } }, 200)
  })
  .openapi(createAnswerRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const { 'idempotency-key': idempotencyKey } = c.req.valid('header')
    const mockPost =
      process.env.MOCK_MODE === 'true' ? MOCK_POSTS.find((item) => item.id === id) : null
    if (process.env.MOCK_MODE === 'true') {
      if (!mockPost) return c.json({ error: '投稿が見つかりません' }, 404)
      if (mockPost.deletedAt)
        return c.json({ error: 'この投稿は削除されたため、回答できません' }, 410)
      if (mockPost.status !== QuestionStatus.OPEN)
        return c.json({ error: '回答を受け付けていない質問です' }, 409)
      return c.json(
        {
          answer: toQaAnswerResponse(
            {
              id: `answer-${Date.now()}`,
              postId: id,
              authorId: user.id,
              author: user,
              body: data.body,
              likeCount: 0,
              likes: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            user.id,
            null,
          ),
          moderation: { isHidden: false },
        },
        201,
      )
    }
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: '投稿が見つかりません' }, 404)
    if (post.deletedAt) return c.json({ error: 'この投稿は削除されたため、回答できません' }, 410)
    if (post.status !== QuestionStatus.OPEN)
      return c.json({ error: '回答を受け付けていない質問です' }, 409)
    const requestedMentionIds = data.mentionedUserIds ?? []
    let mentionedUserIds: string[] = []
    if (requestedMentionIds.length > 0) {
      const candidates = await getQaMentionCandidates(id)
      const userIdByCandidateId = new Map(
        candidates?.map((item) => [item.id, item.userId] as const),
      )
      if (!requestedMentionIds.every((candidateId) => userIdByCandidateId.has(candidateId)))
        return c.json({ error: 'このスレッドの参加者のみメンションできます' }, 400)
      const displayNameByCandidateId = new Map(
        candidates?.map((item) => [item.id, item.displayName] as const),
      )
      if (
        !requestedMentionIds.every((candidateId) =>
          hasBodyMention(data.body, displayNameByCandidateId.get(candidateId) ?? ''),
        )
      )
        return c.json({ error: '本文内のメンションを指定してください' }, 400)
      mentionedUserIds = [
        ...new Set(
          requestedMentionIds
            .map((id) => userIdByCandidateId.get(id))
            .filter((id): id is string => id !== undefined),
        ),
      ]
    }
    let assignment: Awaited<ReturnType<typeof getOrAssignAnonymousProfile>>
    try {
      assignment = await getOrAssignAnonymousProfile(id, user.id)
    } catch {
      return c.json({ error: '回答の作成に失敗しました' }, 500)
    }
    // biome-ignore lint/suspicious/noExplicitAny: Prisma result variants share one variable
    let answer: any
    try {
      answer = await prisma.$transaction(async (tx) => {
        const created = await tx.answer.create({
          data: {
            postId: id,
            authorId: user.id,
            postAnonymousProfileId: assignment.id,
            body: data.body,
            idempotencyKey,
          },
          include: { author: true, postAnonymousProfile: { include: { anonymousProfile: true } } },
        })
        await tx.post.update({
          where: { id },
          data: {
            answerCount: { increment: 1 },
            activityAt: created.createdAt,
          },
        })
        return created
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
        return c.json({ error: '回答の作成に失敗しました' }, 500)
      const existing = await prisma.answer.findUnique({
        where: { authorId_idempotencyKey: { authorId: user.id, idempotencyKey } },
        include: { author: true, postAnonymousProfile: { include: { anonymousProfile: true } } },
      })
      if (!existing) return c.json({ error: '回答の作成に失敗しました' }, 500)
      if (existing.body !== data.body)
        return c.json({ error: '同じ投稿操作に異なる内容が指定されています' }, 409)
      return c.json(
        {
          answer: toQaAnswerResponse(existing, user.id, null),
          moderation: { isHidden: Boolean(existing.isHidden) },
        },
        200,
      )
    }
    const { moderateAnswer } = await import('@/lib/ai/moderate-post')
    const moderation = await moderateAnswer(answer.body)
    if (moderation?.flagged) {
      try {
        const [, hidden] = await prisma.$transaction([
          prisma.aiFlag.create({
            data: {
              title: '不適切な回答の可能性',
              detail: moderation.reason,
              severity: FlagSeverity[moderation.severity],
              targetUserId: user.id,
              answerId: answer.id,
            },
          }),
          prisma.answer.update({
            where: { id: answer.id },
            data: { isHidden: true, hiddenAt: new Date(), hiddenReason: 'AIによる自動検出' },
            include: {
              author: true,
              postAnonymousProfile: { include: { anonymousProfile: true } },
            },
          }),
          prisma.post.update({
            where: { id: answer.postId },
            data: { answerCount: { decrement: 1 } },
          }),
        ])
        answer = hidden
      } catch (error) {
        console.error('Failed to create AI flag', { answerId: answer.id, error })
      }
    }
    if (!answer.isHidden && post.authorId && post.authorId !== user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: NotificationType.POST_ANSWERED,
            postId: post.id,
            answerId: answer.id,
          },
        })
      } catch (error) {
        console.error('Failed to create reply notification', { postId: post.id, error })
      }
    }
    if (!answer.isHidden) {
      const notificationUserIds = mentionedUserIds.filter((id) => id !== user.id)
      if (notificationUserIds.length > 0) {
        try {
          await prisma.notification.createMany({
            data: notificationUserIds.map((userId) => ({
              userId,
              type: NotificationType.MENTIONED,
              postId: post.id,
              answerId: answer.id,
            })),
          })
        } catch (error) {
          console.error('Failed to create mention notifications', { postId: post.id, error })
        }
      }
    }
    return c.json(
      {
        answer: toQaAnswerResponse(answer, user.id, null),
        moderation: { isHidden: Boolean(answer.isHidden) },
      },
      201,
    )
  })
  .openapi(resolveRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((item) => item.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      return c.json(
        {
          question: toQuestionResponse(
            { ...post, status: QuestionStatus.RESOLVED, resolvedAt: new Date() },
            user.id,
          ),
        },
        200,
      )
    }
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (post.authorId !== user.id) return c.json({ error: 'Forbidden' }, 403)
    if (post.status === QuestionStatus.HIDDEN || post.deletedAt)
      return c.json({ error: '操作できない質問の状態です' }, 409)
    const resolved = await prisma.post.update({
      where: { id },
      data: { status: QuestionStatus.RESOLVED, resolvedAt: new Date() },
      include: questionInclude(user.id),
    })
    return c.json({ question: toQuestionResponse(resolved, user.id) }, 200)
  })
  .openapi(likeRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({
            where: { id },
            select: { id: true, authorId: true, likeCount: true, deletedAt: true },
          })
    if (!post || post.deletedAt) return c.json({ error: 'Not found' }, 404)
    if (post.authorId === user.id) return c.json({ error: '自分の質問にはいいねできません' }, 403)
    if (process.env.MOCK_MODE === 'true')
      return c.json({ liked: true, likeCount: post.likeCount + 1 }, 200)
    const { likeCount, isNewLike } = await prisma.$transaction(async (tx) => {
      const created = await tx.questionLike.createMany({
        data: [{ postId: id, userId: user.id }],
        skipDuplicates: true,
      })
      if (created.count === 0) return { likeCount: post.likeCount, isNewLike: false }

      const updatedPost = await tx.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      })
      return { likeCount: updatedPost.likeCount, isNewLike: true }
    })

    if (isNewLike && post.authorId) {
      const authorId = post.authorId
      scheduleAfterResponse(async () => {
        try {
          await prisma.notification.create({
            data: { userId: authorId, type: NotificationType.POST_LIKED, postId: id },
          })
        } catch (error) {
          console.error('Failed to create question like notification', { postId: id, error })
        }
      })
    }

    return c.json({ liked: true, likeCount }, 200)
  })
  .openapi(unlikeRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({
            where: { id },
            select: { id: true, authorId: true, likeCount: true, deletedAt: true },
          })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE === 'true')
      return c.json({ liked: false, likeCount: Math.max(0, post.likeCount - 1) }, 200)
    const likeCount = await prisma.$transaction(async (tx) => {
      const deleted = await tx.questionLike.deleteMany({ where: { postId: id, userId: user.id } })
      if (deleted.count === 0) return post.likeCount
      const updatedPost = await tx.post.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      })
      return updatedPost.likeCount
    })
    return c.json({ liked: false, likeCount }, 200)
  })
  .openapi(bookmarkRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({
            where: { id },
            select: { id: true, bookmarkCount: true },
          })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE === 'true') return c.json({ saved: true, bookmarkCount: 1 }, 200)
    const bookmarkCount = await prisma.$transaction(async (tx) => {
      const created = await tx.postBookmark.createMany({
        data: [{ postId: id, userId: user.id }],
        skipDuplicates: true,
      })
      if (created.count === 0) return post.bookmarkCount
      const updatedPost = await tx.post.update({
        where: { id },
        data: { bookmarkCount: { increment: 1 } },
        select: { bookmarkCount: true },
      })
      return updatedPost.bookmarkCount
    })
    return c.json({ saved: true, bookmarkCount }, 200)
  })
  .openapi(unbookmarkRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post =
      process.env.MOCK_MODE === 'true'
        ? MOCK_POSTS.find((item) => item.id === id)
        : await prisma.post.findUnique({
            where: { id },
            select: { id: true, bookmarkCount: true },
          })
    if (!post) return c.json({ error: 'Not found' }, 404)
    if (process.env.MOCK_MODE === 'true') return c.json({ saved: false, bookmarkCount: 0 }, 200)
    const bookmarkCount = await prisma.$transaction(async (tx) => {
      const deleted = await tx.postBookmark.deleteMany({
        where: { postId: id, userId: user.id },
      })
      if (deleted.count === 0) return post.bookmarkCount
      const updatedPost = await tx.post.update({
        where: { id },
        data: { bookmarkCount: { decrement: 1 } },
        select: { bookmarkCount: true },
      })
      return updatedPost.bookmarkCount
    })
    return c.json({ saved: false, bookmarkCount }, 200)
  })

const tagsRouteDefinition = createRoute({
  method: 'get',
  path: '/',
  tags: ['question-tags'],
  summary: 'Q&Aで使用するタグ候補を取得',
  ...auth,
  responses: {
    200: {
      description: 'Q&Aタグ',
      content: {
        'application/json': {
          schema: z.object({ categories: z.array(QuestionTagCategorySchema) }),
        },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

export const questionTagsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({
  defaultHook,
}).openapi(tagsRouteDefinition, async (c) => {
  if (process.env.MOCK_MODE === 'true')
    return c.json(
      {
        categories: MOCK_TAG_CATEGORIES.map(({ id, name }) => ({
          id,
          name,
          tags: MOCK_TAGS.filter((tag) => tag.category === name && tag.isWorkTag)
            .map(({ id: tagId, name: tagName }) => ({ id: tagId, name: tagName }))
            .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
        })).filter((category) => category.tags.length > 0),
      },
      200,
    )
  const categories = await prisma.tagCategory.findMany({
    where: { tags: { some: { isWorkTag: true } } },
    select: {
      id: true,
      name: true,
      tags: {
        where: { isWorkTag: true },
        select: { id: true, name: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
  return c.json({ categories }, 200)
})

const myQuestionsDefinition = createRoute({
  method: 'get',
  path: '/questions',
  tags: ['users'],
  summary: '自分が投稿した質問を取得',
  ...auth,
  request: { query: PageQuerySchema },
  responses: {
    200: {
      description: '投稿した質問',
      content: { 'application/json': { schema: QuestionListResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})
const savedQuestionsDefinition = createRoute({
  method: 'get',
  path: '/saved-questions',
  tags: ['users'],
  summary: '自分が保存した質問を取得',
  ...auth,
  request: { query: PageQuerySchema },
  responses: {
    200: {
      description: '保存した質問',
      content: { 'application/json': { schema: QuestionListResponseSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

export const meQuestionsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(myQuestionsDefinition, async (c) => {
    const user = c.get('user')
    const { page, pageSize } = c.req.valid('query')
    if (process.env.MOCK_MODE === 'true') {
      const all = mockQuestions(user.id).filter((q) => q.isOwnQuestion)
      return c.json(
        {
          questions: all.slice((page - 1) * pageSize, page * pageSize),
          pagination: pagination(page, pageSize, all.length),
        },
        200,
      )
    }
    const where = { authorId: user.id, deletedAt: null, status: { not: QuestionStatus.HIDDEN } }
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: questionInclude(user.id),
        orderBy: [{ activityAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])
    return c.json(
      {
        questions: posts.map((post) => toQuestionResponse(post, user.id)),
        pagination: pagination(page, pageSize, total),
      },
      200,
    )
  })
  .openapi(savedQuestionsDefinition, async (c) => {
    const user = c.get('user')
    const { page, pageSize } = c.req.valid('query')
    if (process.env.MOCK_MODE === 'true') {
      const all = mockQuestions(user.id)
        .slice(0, 2)
        .map((q) => ({ ...q, saved: true, bookmarkCount: Math.max(1, q.bookmarkCount) }))
      return c.json(
        {
          questions: all.slice((page - 1) * pageSize, page * pageSize),
          pagination: pagination(page, pageSize, all.length),
        },
        200,
      )
    }
    const where = {
      userId: user.id,
      post: { deletedAt: null, status: { not: QuestionStatus.HIDDEN } },
    }
    const [bookmarks, total] = await Promise.all([
      prisma.postBookmark.findMany({
        where,
        include: { post: { include: questionInclude(user.id) } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.postBookmark.count({ where }),
    ])
    return c.json(
      {
        questions: bookmarks.map((bookmark) => toQuestionResponse(bookmark.post, user.id)),
        pagination: pagination(page, pageSize, total),
      },
      200,
    )
  })
