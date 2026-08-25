import { cookies } from 'next/headers'
import { cache } from 'react'
import { serializeCookies } from '@/lib/auth/cookies'
import { getUserByCookie } from '@/lib/auth/user-by-cookie'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

export const getCurrentUser = cache(async () => {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_USERS[0]
  }

  const cookieHeader = serializeCookies((await cookies()).getAll())
  const resolution = await getUserByCookie(cookieHeader)
  return resolution.status === 'authenticated' ? resolution.user : null
})
