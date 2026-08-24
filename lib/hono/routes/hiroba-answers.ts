import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { NotificationType } from '@/app/generated/prisma/enums'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, IdParamSchema, LikeStatusSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_HIROBA_ANSWERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

const likeRoute = createRoute({
  method: 'post',
  path: '/{id}/likes',
  tags: ['hiroba-answers'],
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
  tags: ['hiroba-answers'],
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

export const hirobaAnswersRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(likeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const answer = MOCK_HIROBA_ANSWERS.find((a) => a.id === id)
      if (!answer) return c.json({ error: 'Not found' }, 404)
      if (answer.authorId === user.id)
        return c.json({ error: '自分の回答にはいいねできません' }, 403)
      return c.json({ liked: true, likeCount: answer.likeCount + 1 }, 200)
    }

    const answer = await prisma.hirobaAnswer.findUnique({ where: { id } })
    if (!answer) return c.json({ error: 'Not found' }, 404)
    if (answer.authorId === user.id) return c.json({ error: '自分の回答にはいいねできません' }, 403)

    const likeCount = await prisma.$transaction(async (tx) => {
      const created = await tx.hirobaAnswerLike.createMany({
        data: [{ hirobaAnswerId: id, userId: user.id }],
        skipDuplicates: true,
      })
      if (created.count === 0) return answer.likeCount

      const [, updatedAnswer] = await Promise.all([
        answer.authorId
          ? tx.notification.create({
              data: {
                userId: answer.authorId,
                type: NotificationType.HIROBA_ANSWER_LIKED,
                hirobaAnswerId: id,
              },
            })
          : Promise.resolve(null),
        tx.hirobaAnswer.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ])
      return updatedAnswer.likeCount
    })
    return c.json({ liked: true, likeCount }, 200)
  })
  .openapi(unlikeRoute, async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const answer = MOCK_HIROBA_ANSWERS.find((a) => a.id === id)
      if (!answer) return c.json({ error: 'Not found' }, 404)
      return c.json({ liked: false, likeCount: Math.max(0, answer.likeCount - 1) }, 200)
    }

    const answer = await prisma.hirobaAnswer.findUnique({ where: { id } })
    if (!answer) return c.json({ error: 'Not found' }, 404)

    const likeCount = await prisma.$transaction(async (tx) => {
      const deleted = await tx.hirobaAnswerLike.deleteMany({
        where: { hirobaAnswerId: id, userId: user.id },
      })
      if (deleted.count === 0) return answer.likeCount

      const updatedAnswer = await tx.hirobaAnswer.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      })
      return updatedAnswer.likeCount
    })
    return c.json({ liked: false, likeCount }, 200)
  })
