import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, SuccessSchema } from '@/lib/hono/openapi/schemas'
import { MOCK_PASSWORD_RESETS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { completePasswordResetSchema } from '@/lib/schemas/password-reset'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

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
    404: errorResponse('リンクが見つからない、期限切れ、または使用済み', 'リンクが見つかりません'),
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
    404: errorResponse('リンクが見つからない、期限切れ、または使用済み', 'リンクが見つかりません'),
    500: errorResponse('パスワード更新に失敗した', 'パスワード更新に失敗しました'),
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

    const now = new Date()

    // usedAt/expiresAtを条件にした原子的な確保。同一トークンの並行リクエストでも1件しか成功しない
    const claimed = await prisma.passwordReset.updateMany({
      where: { token, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    })
    if (claimed.count !== 1) {
      return c.json({ error: 'リンクが見つかりません' }, 404)
    }

    const reset = await prisma.passwordReset.findUniqueOrThrow({ where: { token } })
    const user = await prisma.user.findUnique({ where: { id: reset.userId } })
    if (!user) return c.json({ error: 'リンクが見つかりません' }, 404)

    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, { password })
    if (error) {
      // 外部更新に失敗したのでトークンを解放し、再試行できるようにする
      await prisma.passwordReset.update({ where: { token }, data: { usedAt: null } })
      return c.json({ error: 'パスワード更新に失敗しました' }, 500)
    }

    return c.json({ success: true }, 200)
  })
