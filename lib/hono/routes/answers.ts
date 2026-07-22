import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, IdParamSchema, LikeStatusSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_ANSWERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

const likeRoute = createRoute({
  method: 'post',
  path: '/{id}/likes',
  tags: ['answers'],
  summary: '回答にいいねする',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'いいね後の状態',
      content: { 'application/json': { schema: LikeStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('自分の回答にはいいねできない', '自分の回答にはいいねできません'),
    404: errorResponse('回答が見つからない', 'Not found'),
    500: errorResponse('いいねの処理に失敗した', 'いいねの処理に失敗しました'),
  },
})

const unlikeRoute = createRoute({
  method: 'delete',
  path: '/{id}/likes',
  tags: ['answers'],
  summary: '回答へのいいねを取り消す',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'いいね取り消し後の状態',
      content: { 'application/json': { schema: LikeStatusSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    404: errorResponse('回答が見つからない', 'Not found'),
    500: errorResponse('いいね取り消しの処理に失敗した', 'いいね取り消しの処理に失敗しました'),
  },
})

export const answersRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(likeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const answer = MOCK_ANSWERS.find((a) => a.id === id)
      if (!answer) return c.json({ error: 'Not found' }, 404)
      if (answer.authorId === user.id)
        return c.json({ error: '自分の回答にはいいねできません' }, 403)
      return c.json({ liked: true, likeCount: answer.likeCount + 1 }, 200)
    }

    const answer = await prisma.answer.findUnique({ where: { id } })
    if (!answer) return c.json({ error: 'Not found' }, 404)
    if (answer.authorId === user.id) return c.json({ error: '自分の回答にはいいねできません' }, 403)

    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.answerLike.createMany({
        data: [{ answerId: id, userId: user.id }],
        skipDuplicates: true,
      })
      const likeCount = await tx.answerLike.count({ where: { answerId: id } })
      await tx.answer.update({ where: { id }, data: { likeCount } })
      return likeCount
    })
    return c.json({ liked: true, likeCount }, 200)
  })
  .openapi(unlikeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const answer = MOCK_ANSWERS.find((a) => a.id === id)
      if (!answer) return c.json({ error: 'Not found' }, 404)
      return c.json({ liked: false, likeCount: Math.max(0, answer.likeCount - 1) }, 200)
    }

    const answer = await prisma.answer.findUnique({ where: { id } })
    if (!answer) return c.json({ error: 'Not found' }, 404)

    const likeCount = await prisma.$transaction(async (tx) => {
      await tx.answerLike.deleteMany({ where: { answerId: id, userId: user.id } })
      const likeCount = await tx.answerLike.count({ where: { answerId: id } })
      await tx.answer.update({ where: { id }, data: { likeCount } })
      return likeCount
    })
    return c.json({ liked: false, likeCount }, 200)
  })
