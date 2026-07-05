import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '@/lib/hono/middleware/auth'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@supabase/ssr'

const createUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export const usersRoute = new Hono()
  // 登録直後に呼ばれる — Supabaseセッションクッキーからユーザーを特定してPrisma Userを作成
  .post('/', zValidator('json', createUserSchema), async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookie = c.req.header('cookie') ?? ''
            return cookie.split(';').flatMap((part) => {
              const [name, ...rest] = part.trim().split('=')
              if (!name) return []
              return [{ name: name.trim(), value: rest.join('=') }]
            })
          },
          setAll() {},
        },
      }
    )

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return c.json({ error: 'Unauthorized' }, 401)

    const { name } = c.req.valid('json')

    const existing = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })
    if (existing) return c.json({ user: existing })

    const user = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email!,
        name: name ?? authUser.user_metadata?.name ?? null,
      },
    })

    return c.json({ user }, 201)
  })
  // 自分のプロフィール取得
  .get('/me', authMiddleware, async (c) => {
    const user = c.get('user')
    return c.json({ user })
  })
