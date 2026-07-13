import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { errorResponse, SuccessSchema } from '@/lib/hono/openapi/schemas'

const ping = createRoute({
  method: 'get',
  path: '/ping',
  tags: ['ping'],
  summary: 'ping疎通',
  responses: {
    200: {
      description: '接続確認',
      content: { 'application/json': { schema: SuccessSchema } },
    },
    401: errorResponse('接続エラーが発生しました'),
  },
})

export const pingRoute = new OpenAPIHono()

pingRoute.openapi(ping, async (c) => {
  return c.json({ success: true }, 200)
})
