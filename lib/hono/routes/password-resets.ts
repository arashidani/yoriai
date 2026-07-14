import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { requireEnv } from '@/lib/env'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, SuccessSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_PASSWORD_RESETS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { completePasswordResetSchema } from '@/lib/schemas/password-reset'

const TokenParamSchema = z.object({
  token: z.string().openapi({ param: { name: 'token', in: 'path' }, example: 'a1b2c3' }),
})

const getPasswordResetRoute = createRoute({
  method: 'get',
  path: '/{token}',
  tags: ['password-resets'],
  summary: 'パスワードリセットリンクの有効性を確認',
  request: { params: TokenParamSchema },
  responses: {
    200: {
      description: '有効なリセットリンク',
      content: { 'application/json': { schema: z.object({ valid: z.literal(true) }) } },
    },
    404: errorResponse('リンクが見つからない、期限切れ、または使用済み'),
  },
})

const completePasswordResetRoute = createRoute({
  method: 'post',
  path: '/{token}',
  tags: ['password-resets'],
  summary: '新しいパスワードを設定',
  request: {
    params: TokenParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: completePasswordResetSchema } },
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: { 'application/json': { schema: SuccessSchema } },
    },
    404: errorResponse('リンクが見つからない、期限切れ、または使用済み'),
  },
})

export const passwordResetsRoute = new OpenAPIHono({ defaultHook })
  .openapi(getPasswordResetRoute, async (c) => {
    const { token } = c.req.valid('param')

    if (process.env.MOCK_MODE === 'true') {
      const reset = MOCK_PASSWORD_RESETS.find((r) => r.token === token)
      if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        return c.json({ error: 'リンクが見つかりません' }, 404)
      }
      return c.json({ valid: true as const }, 200)
    }

    const reset = await prisma.passwordReset.findUnique({ where: { token } })
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return c.json({ error: 'リンクが見つかりません' }, 404)
    }
    return c.json({ valid: true as const }, 200)
  })
  .openapi(completePasswordResetRoute, async (c) => {
    const { token } = c.req.valid('param')
    const { password } = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      const reset = MOCK_PASSWORD_RESETS.find((r) => r.token === token)
      if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        return c.json({ error: 'リンクが見つかりません' }, 404)
      }
      return c.json({ success: true }, 200)
    }

    const reset = await prisma.passwordReset.findUnique({ where: { token } })
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return c.json({ error: 'リンクが見つかりません' }, 404)
    }

    const user = await prisma.user.findUnique({ where: { id: reset.userId } })
    if (!user) return c.json({ error: 'リンクが見つかりません' }, 404)

    const supabaseAdmin = createSupabaseAdminClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    )
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, { password })
    if (error) return c.json({ error: error.message }, 404)

    await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } })
    return c.json({ success: true }, 200)
  })
