import { createMiddleware } from 'hono/factory'
import type { User } from '@/app/generated/prisma/client'
import { getUserByCookie } from '@/lib/auth/user-by-cookie'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

export type AuthVariables = {
  user: User | (typeof MOCK_USERS)[number]
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (process.env.MOCK_MODE === 'true') {
    c.set('user', MOCK_USERS[0])
    return next()
  }

  const resolution = await getUserByCookie(c.req.header('cookie') ?? '')
  if (resolution.status === 'unauthorized') return c.json({ error: 'Unauthorized' }, 401)
  if (resolution.status === 'user-not-found') return c.json({ error: 'User not found' }, 401)

  c.set('user', resolution.user)
  return next()
})
