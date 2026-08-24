import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Prisma } from '@/app/generated/prisma/client'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import {
  errorResponse,
  IdParamSchema,
  NotificationSchema,
  UnreadNotificationCountSchema,
} from '@/lib/hono/openapi/schemas'
import { MOCK_NOTIFICATIONS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import {
  toAdminAnswerResponse,
  toAnswerAnonymousProfileResponse,
} from '@/lib/questions/admin-answer-response'

const listQuerySchema = z.object({
  cursor: z
    .string()
    .optional()
    .openapi({
      param: { name: 'cursor', in: 'query' },
      example: 'notification-20',
    }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .openapi({
      param: { name: 'limit', in: 'query' },
      example: 20,
    }),
})

const notificationInclude = {
  post: true,
  answer: { include: { postAnonymousProfile: { include: { anonymousProfile: true } } } },
  hirobaPost: true,
  hirobaAnswer: true,
} satisfies Prisma.NotificationInclude

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude
}>

const toNotificationResponse = (notification: NotificationWithRelations) => ({
  ...notification,
  answer: notification.answer ? toAdminAnswerResponse(notification.answer) : null,
})

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['notifications'],
  summary: '自分の通知一覧をカーソルベースで取得（作成日時降順）',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { query: listQuerySchema },
  responses: {
    200: {
      description: '通知一覧',
      content: {
        'application/json': {
          schema: z.object({
            notifications: z.array(NotificationSchema),
            nextCursor: z.string().nullable(),
          }),
        },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const unreadCountRoute = createRoute({
  method: 'get',
  path: '/unread-count',
  tags: ['notifications'],
  summary: '自分の未読通知件数を取得',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      description: '未読件数',
      content: { 'application/json': { schema: UnreadNotificationCountSchema } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const markAsReadRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['notifications'],
  summary: '通知を既読にする',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: '既読化後の通知',
      content: {
        'application/json': { schema: z.object({ notification: NotificationSchema }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('自分宛て以外の通知への操作', 'Forbidden'),
    404: errorResponse('通知が見つからない', 'Not found'),
  },
})

export const notificationsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listRoute, async (c) => {
    const user = c.get('user')
    const { cursor, limit } = c.req.valid('query')

    if (process.env.MOCK_MODE === 'true') {
      const notifications = MOCK_NOTIFICATIONS.filter((item) => item.userId === user.id).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )
      const start = cursor ? notifications.findIndex((item) => item.id === cursor) + 1 : 0
      const page = notifications.slice(start, start + limit + 1)
      const hasNextPage = page.length > limit
      const items = page.slice(0, limit).map((notification) => {
        if (!notification.answer) return notification
        const { anonymousProfile, ...answer } = notification.answer
        return {
          ...notification,
          answer: {
            ...answer,
            anonymousProfile: toAnswerAnonymousProfileResponse(anonymousProfile),
          },
        }
      })
      return c.json(
        {
          notifications: items,
          nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        },
        200,
      )
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      include: notificationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const hasNextPage = notifications.length > limit
    const page = notifications.slice(0, limit)
    return c.json(
      {
        notifications: page.map(toNotificationResponse),
        nextCursor: hasNextPage ? (page.at(-1)?.id ?? null) : null,
      },
      200,
    )
  })
  .openapi(unreadCountRoute, async (c) => {
    const user = c.get('user')

    if (process.env.MOCK_MODE === 'true') {
      const count = MOCK_NOTIFICATIONS.filter(
        (notification) => notification.userId === user.id && !notification.isRead,
      ).length
      return c.json({ count }, 200)
    }

    const count = await prisma.notification.count({ where: { userId: user.id, isRead: false } })
    return c.json({ count }, 200)
  })
  .openapi(markAsReadRoute, async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const notification = MOCK_NOTIFICATIONS.find((item) => item.id === id)
      if (!notification) return c.json({ error: 'Not found' }, 404)
      if (notification.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)
      if (!notification.answer)
        return c.json({ notification: { ...notification, isRead: true } }, 200)
      const { anonymousProfile, ...answer } = notification.answer
      return c.json(
        {
          notification: {
            ...notification,
            isRead: true,
            answer: {
              ...answer,
              anonymousProfile: toAnswerAnonymousProfileResponse(anonymousProfile),
            },
          },
        },
        200,
      )
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: notificationInclude,
    })
    if (!notification) return c.json({ error: 'Not found' }, 404)
    if (notification.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: notificationInclude,
    })
    return c.json({ notification: toNotificationResponse(updated) }, 200)
  })
