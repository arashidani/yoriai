import { z } from '@hono/zod-openapi'

const dateTime = () =>
  z.date().openapi({ type: 'string', format: 'date-time', example: '2026-08-08T00:00:00.000Z' })

export const QuestionTagSchema = z
  .object({
    id: z.string().openapi({ example: 'tag-1' }),
    name: z.string().openapi({ example: 'プロジェクト管理' }),
  })
  .openapi('QuestionTag')

export const QuestionTagCategorySchema = z
  .object({
    id: z.string().openapi({ example: 'tag-category-1' }),
    name: z.string().openapi({ example: '業務' }),
    tags: z.array(QuestionTagSchema),
  })
  .openapi('QuestionTagCategory')

export const DisplayAuthorSchema = z
  .object({
    displayName: z.string().openapi({ example: 'ねこ' }),
    avatarUrl: z.string().nullable().openapi({ example: '/anonymous-profiles/cat.svg' }),
  })
  .openapi('QuestionDisplayAuthor')

export const QuestionSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    status: z.enum(['OPEN', 'RESOLVED']),
    answerCount: z.number().int().nonnegative(),
    likeCount: z.number().int().nonnegative(),
    liked: z.boolean(),
    saved: z.boolean(),
    isOwnQuestion: z.boolean(),
    displayAuthor: DisplayAuthorSchema,
    tag: z.union([QuestionTagSchema, z.null()]),
    resolvedAt: z.union([dateTime(), z.null()]),
    createdAt: dateTime(),
    activityAt: dateTime().openapi({
      description: '質問投稿日と最新回答投稿日のうち新しい日時',
    }),
    updatedAt: dateTime(),
  })
  .openapi('Question')

export const QaAnswerSchema = z
  .object({
    id: z.string(),
    questionId: z.string(),
    body: z.string(),
    likeCount: z.number().int().nonnegative(),
    liked: z.boolean(),
    isOwnAnswer: z.boolean(),
    isMostLiked: z
      .boolean()
      .openapi({ description: '募集終了済み質問の最多いいね回答1件だけtrue' }),
    displayAuthor: DisplayAuthorSchema,
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('QuestionAnswer')

export const ModerationResultSchema = z
  .object({
    isHidden: z.boolean().openapi({ description: 'AI判定によって非公開になった場合はtrue' }),
  })
  .openapi('ModerationResult')

export const PaginationSchema = z
  .object({
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .openapi('QuestionPagination')

export const QuestionListResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  pagination: PaginationSchema,
})

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(50).default(10).openapi({ example: 10 }),
})

export const QuestionListQuerySchema = PageQuerySchema.extend({
  keyword: z.string().trim().max(100).optional(),
  status: z.enum(['all', 'unanswered', 'resolved']).default('all'),
  tagId: z.string().optional(),
  categoryIds: z.string().optional().openapi({ example: 'tag-category-1,tag-category-2' }),
  tagIds: z.string().optional().openapi({ example: 'tag-1,tag-2' }),
})
