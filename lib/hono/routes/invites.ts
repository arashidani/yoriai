import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, InviteSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_INVITES } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

const TokenParamSchema = z.object({
  token: z.string().openapi({ param: { name: 'token', in: 'path' }, example: 'a1b2c3' }),
})

const getInviteRoute = createRoute({
  method: 'get',
  path: '/{token}',
  tags: ['invites'],
  summary: '招待リンクの有効性を確認',
  request: { params: TokenParamSchema },
  responses: {
    200: {
      description: '有効な招待',
      content: { 'application/json': { schema: z.object({ invite: InviteSchema }) } },
    },
    404: errorResponse('招待が見つからない、期限切れ、または使用済み'),
  },
})

export const invitesRoute = new OpenAPIHono({ defaultHook }).openapi(getInviteRoute, async (c) => {
  const { token } = c.req.valid('param')

  if (process.env.MOCK_MODE === 'true') {
    const invite = MOCK_INVITES.find((i) => i.token === token)
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return c.json({ error: '招待が見つかりません' }, 404)
    }
    return c.json({ invite: { name: invite.name, role: invite.role } }, 200)
  }

  const invite = await prisma.invite.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return c.json({ error: '招待が見つかりません' }, 404)
  }
  return c.json({ invite: { name: invite.name, role: invite.role } }, 200)
})
