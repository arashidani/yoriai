import { $, createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import { Role } from '@/app/generated/prisma/enums'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  errorResponse,
  IdParamSchema,
  PostSchema,
  SuccessSchema,
  UserSchema,
} from '@/lib/hono/openapi/schemas'
import { MOCK_POSTS, MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { updateUserSchema } from '@/lib/schemas/user'

const adminGuard = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (c.get('user').role !== Role.ADMIN) return c.json({ error: 'Forbidden' }, 403)
  return next()
})

const security = [{ supabaseSession: [] }]
const QuestionIdParamSchema = z.object({
  questionId: z.string().openapi({
    param: { name: 'questionId', in: 'path' },
    example: 'question-1',
  }),
})
const AnswerIdParamSchema = z.object({
  answerId: z.string().openapi({
    param: { name: 'answerId', in: 'path' },
    example: 'answer-1',
  }),
})
const ReportSummarySchema = z.object({
  id: z.string().openapi({ example: 'report-1' }),
  targetType: z.enum(['question', 'answer']).openapi({ example: 'question' }),
  targetId: z.string().openapi({ example: 'question-1' }),
  reason: z.string().openapi({ example: '誹謗中傷が含まれているため確認してほしいです。' }),
  status: z.enum(['open', 'handled']).openapi({ example: 'open' }),
  createdAt: z.string().datetime().openapi({ example: '2026-07-16T12:00:00.000Z' }),
})
const IdentitySchema = z.object({
  userId: z.string().openapi({ example: 'user-1' }),
  name: z.string().nullable().openapi({ example: '一般ユーザー' }),
  email: z.string().openapi({ example: 'user@example.com' }),
})

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

const listReportsRoute = createRoute({
  method: 'get',
  path: '/reports',
  tags: ['admin'],
  summary: '通報一覧を取得（管理者専用）',
  security,
  responses: {
    200: {
      description: '通報一覧',
      content: {
        'application/json': { schema: z.object({ reports: z.array(ReportSummarySchema) }) },
      },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    501: errorResponse('未実装'),
  },
})

const hideQuestionRoute = createRoute({
  method: 'post',
  path: '/questions/{questionId}/hide',
  tags: ['admin'],
  summary: '質問を非表示にする（管理者専用）',
  security,
  request: { params: QuestionIdParamSchema },
  responses: {
    200: { description: '非表示成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    404: errorResponse('質問が見つからない'),
    501: errorResponse('未実装'),
  },
})

const hideAnswerRoute = createRoute({
  method: 'post',
  path: '/answers/{answerId}/hide',
  tags: ['admin'],
  summary: '回答を非表示にする（管理者専用）',
  security,
  request: { params: AnswerIdParamSchema },
  responses: {
    200: { description: '非表示成功', content: { 'application/json': { schema: SuccessSchema } } },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    404: errorResponse('回答が見つからない'),
    501: errorResponse('未実装'),
  },
})

const getQuestionIdentityRoute = createRoute({
  method: 'get',
  path: '/questions/{questionId}/identity',
  tags: ['admin'],
  summary: '質問者の実ユーザー情報を取得（管理者専用）',
  security,
  request: { params: QuestionIdParamSchema },
  responses: {
    200: {
      description: '質問者情報',
      content: { 'application/json': { schema: z.object({ user: IdentitySchema }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    404: errorResponse('質問が見つからない'),
    501: errorResponse('未実装'),
  },
})

const getAnswerIdentityRoute = createRoute({
  method: 'get',
  path: '/answers/{answerId}/identity',
  tags: ['admin'],
  summary: '回答者の実ユーザー情報を取得（管理者専用）',
  security,
  request: { params: AnswerIdParamSchema },
  responses: {
    200: {
      description: '回答者情報',
      content: { 'application/json': { schema: z.object({ user: IdentitySchema }) } },
    },
    401: errorResponse('未認証'),
    403: errorResponse('権限不足（管理者専用）'),
    404: errorResponse('回答が見つからない'),
    501: errorResponse('未実装'),
  },
})

const mockReports = [
  {
    id: 'report-1',
    targetType: 'question' as const,
    targetId: 'question-1',
    reason: '誹謗中傷が含まれているため確認してほしいです。',
    status: 'open' as const,
    createdAt: '2026-07-16T12:00:00.000Z',
  },
]

const mockIdentity = {
  userId: 'user-1',
  name: '一般ユーザー',
  email: 'user@example.com',
}

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
  .openapi(listReportsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ reports: mockReports }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(hideQuestionRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { questionId } = c.req.valid('param')
      if (questionId !== 'question-1') {
        return c.json({ error: 'Question not found' }, 404)
      }
      return c.json({ success: true }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(hideAnswerRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { answerId } = c.req.valid('param')
      if (answerId !== 'answer-1') {
        return c.json({ error: 'Answer not found' }, 404)
      }
      return c.json({ success: true }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(getQuestionIdentityRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { questionId } = c.req.valid('param')
      if (questionId !== 'question-1') {
        return c.json({ error: 'Question not found' }, 404)
      }
      return c.json({ user: mockIdentity }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
  .openapi(getAnswerIdentityRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      const { answerId } = c.req.valid('param')
      if (answerId !== 'answer-1') {
        return c.json({ error: 'Answer not found' }, 404)
      }
      return c.json({ user: mockIdentity }, 200)
    }
    return c.json({ error: 'Not implemented yet' }, 501)
  })
