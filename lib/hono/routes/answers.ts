import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, SuccessSchema } from '@/lib/hono/openapi/schemas'

const AnswerIdParamSchema = z.object({
  answerId: z.string().openapi({
    param: { name: 'answerId', in: 'path' },
    example: 'answer-1',
  }),
})

const CreateReportSchema = z.object({
  reason: z.string().min(1).openapi({ example: '不適切な表現が含まれています。' }),
})

const reportAnswerRoute = createRoute({
  method: 'post',
  path: '/{answerId}/reports',
  tags: ['reports'],
  summary: '回答を通報',
  description: '不適切な回答を通報する。',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: AnswerIdParamSchema,
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
    404: errorResponse('回答が見つからない'),
    501: errorResponse('未実装'),
  },
})

export const answersRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook }).openapi(
  reportAnswerRoute,
  async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { answerId } = c.req.valid('param')
      if (answerId !== 'answer-1') {
        return c.json({ error: 'Answer not found' }, 404)
      }
      return c.json({ success: true }, 201)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  },
)
