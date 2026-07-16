import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, SuccessSchema } from '@/lib/hono/openapi/schemas'

const QuestionStatusSchema = z.enum(['open', 'answered', 'resolved', 'hidden'])

const QuestionSummarySchema = z.object({
  id: z.string().openapi({ example: 'question-1' }),
  title: z.string().openapi({ example: '年末調整の申請期限はいつですか？' }),
  status: QuestionStatusSchema.openapi({ example: 'open' }),
  answerCount: z.number().int().openapi({ example: 0 }),
  createdAt: z.string().datetime().openapi({ example: '2026-07-16T09:00:00.000Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2026-07-16T09:00:00.000Z' }),
})

const QuestionDetailSchema = QuestionSummarySchema.extend({
  body: z.string().openapi({ example: '今年の申請締切日と提出先を知りたいです。' }),
  answers: z
    .array(
      z.object({
        id: z.string().openapi({ example: 'answer-1' }),
        body: z.string().openapi({ example: '総務ポータルの年末調整ページに案内があります。' }),
        createdAt: z.string().datetime().openapi({ example: '2026-07-16T10:00:00.000Z' }),
      }),
    )
    .openapi({ example: [] }),
})

const ListQuestionsQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .openapi({
      param: { name: 'q', in: 'query' },
      example: '年末調整',
      description: '質問タイトル・質問本文を対象にしたキーワード検索',
    }),
  status: QuestionStatusSchema.optional().openapi({
    param: { name: 'status', in: 'query' },
    example: 'open',
    description: '質問ステータス絞り込み',
  }),
  unansweredOnly: z.coerce
    .boolean()
    .optional()
    .openapi({
      param: { name: 'unansweredOnly', in: 'query' },
      example: true,
      description: '未回答の質問だけを取得する',
    }),
})

const CreateQuestionSchema = z.object({
  title: z.string().min(1).max(200).openapi({ example: '年末調整の申請期限はいつですか？' }),
  body: z.string().min(1).openapi({ example: '提出先もあわせて知りたいです。' }),
})

const CreateAnswerSchema = z.object({
  body: z.string().min(1).openapi({ example: '総務ポータルの年末調整ページに案内があります。' }),
})

const CreateReportSchema = z.object({
  reason: z.string().min(1).openapi({ example: '誹謗中傷が含まれているため確認してほしいです。' }),
})

const QuestionIdParamSchema = z.object({
  questionId: z.string().openapi({
    param: { name: 'questionId', in: 'path' },
    example: 'question-1',
  }),
})

const listQuestionsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['questions'],
  summary: '質問一覧を取得',
  description: '新着一覧、キーワード検索、未回答・解決済みなどの絞り込みに使う。',
  request: { query: ListQuestionsQuerySchema },
  responses: {
    200: {
      description: '質問一覧',
      content: {
        'application/json': {
          schema: z.object({ questions: z.array(QuestionSummarySchema) }),
        },
      },
    },
    501: errorResponse('未実装'),
  },
})

const createQuestionRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['questions'],
  summary: '質問を投稿',
  description: '質問タイトルと質問本文を受け取り、新しい質問スレッドを作成する。',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: CreateQuestionSchema } },
    },
  },
  responses: {
    201: {
      description: '作成された質問',
      content: {
        'application/json': {
          schema: z.object({ question: QuestionDetailSchema }),
        },
      },
    },
    401: errorResponse('未認証'),
    501: errorResponse('未実装'),
  },
})

const getQuestionRoute = createRoute({
  method: 'get',
  path: '/{questionId}',
  tags: ['questions'],
  summary: '質問詳細を取得',
  description: '質問本文、ステータス、回答一覧を取得する。',
  request: { params: QuestionIdParamSchema },
  responses: {
    200: {
      description: '質問詳細',
      content: {
        'application/json': {
          schema: z.object({ question: QuestionDetailSchema }),
        },
      },
    },
    404: errorResponse('質問が見つからない'),
    501: errorResponse('未実装'),
  },
})

const createAnswerRoute = createRoute({
  method: 'post',
  path: '/{questionId}/answers',
  tags: ['questions'],
  summary: '回答を投稿',
  description: '対象質問に回答を追加する。',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: QuestionIdParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: CreateAnswerSchema } },
    },
  },
  responses: {
    201: {
      description: '作成された回答',
      content: {
        'application/json': {
          schema: z.object({
            answer: z.object({
              id: z.string().openapi({ example: 'answer-2' }),
              body: z.string().openapi({ example: '提出先は人事労務チームです。' }),
              createdAt: z.string().datetime().openapi({ example: '2026-07-16T11:00:00.000Z' }),
            }),
          }),
        },
      },
    },
    401: errorResponse('未認証'),
    404: errorResponse('質問が見つからない'),
    409: errorResponse('解決済みの質問には回答できない'),
    501: errorResponse('未実装'),
  },
})

const resolveQuestionRoute = createRoute({
  method: 'post',
  path: '/{questionId}/resolve',
  tags: ['questions'],
  summary: '質問を解決済みにする',
  description: '質問者が回答受付を終了し、質問を解決済みにする。',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: QuestionIdParamSchema },
  responses: {
    200: {
      description: '解決済み更新成功',
      content: { 'application/json': { schema: SuccessSchema } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('質問者のみ操作可能'),
    404: errorResponse('質問が見つからない'),
    409: errorResponse('すでに解決済み'),
    501: errorResponse('未実装'),
  },
})

const reportQuestionRoute = createRoute({
  method: 'post',
  path: '/{questionId}/reports',
  tags: ['reports'],
  summary: '質問を通報',
  description: '不適切な質問を通報する。',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: QuestionIdParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: CreateReportSchema } },
    },
  },
  responses: {
    201: {
      description: '通報作成成功',
      content: { 'application/json': { schema: SuccessSchema } },
    },
    401: errorResponse('未認証'),
    404: errorResponse('質問が見つからない'),
    501: errorResponse('未実装'),
  },
})

const mockQuestion = {
  id: 'question-1',
  title: '年末調整の申請期限はいつですか？',
  body: '提出先もあわせて知りたいです。',
  status: 'open' as const,
  answerCount: 1,
  createdAt: '2026-07-16T09:00:00.000Z',
  updatedAt: '2026-07-16T10:00:00.000Z',
  answers: [
    {
      id: 'answer-1',
      body: '総務ポータルの年末調整ページに案内があります。',
      createdAt: '2026-07-16T10:00:00.000Z',
    },
  ],
}

export const questionsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listQuestionsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ questions: [mockQuestion] }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(createQuestionRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const payload = c.req.valid('json')
      return c.json(
        {
          question: {
            ...mockQuestion,
            title: payload.title,
            body: payload.body,
            answerCount: 0,
            answers: [],
          },
        },
        201,
      )
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(getQuestionRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { questionId } = c.req.valid('param')
      if (questionId !== mockQuestion.id) {
        return c.json({ error: 'Question not found' }, 404)
      }
      return c.json({ question: mockQuestion }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(createAnswerRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { questionId } = c.req.valid('param')
      const payload = c.req.valid('json')
      if (questionId !== mockQuestion.id) {
        return c.json({ error: 'Question not found' }, 404)
      }
      if (mockQuestion.status === 'resolved') {
        return c.json({ error: 'Question is already resolved' }, 409)
      }
      return c.json(
        {
          answer: {
            id: 'answer-2',
            body: payload.body,
            createdAt: '2026-07-16T11:00:00.000Z',
          },
        },
        201,
      )
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(resolveQuestionRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { questionId } = c.req.valid('param')
      if (questionId !== mockQuestion.id) {
        return c.json({ error: 'Question not found' }, 404)
      }
      return c.json({ success: true }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(reportQuestionRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { questionId } = c.req.valid('param')
      if (questionId !== mockQuestion.id) {
        return c.json({ error: 'Question not found' }, 404)
      }
      return c.json({ success: true }, 201)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
