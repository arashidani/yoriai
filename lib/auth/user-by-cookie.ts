import { createServerClient } from '@supabase/ssr'
import { cache } from 'react'
import type { User } from '@/app/generated/prisma/client'
import { parseCookieHeader } from '@/lib/auth/cookies'
import { requireEnv } from '@/lib/env'
import { prisma } from '@/lib/prisma/client'

export type AuthResolution =
  | { status: 'authenticated'; user: User }
  | { status: 'unauthorized' }
  | { status: 'user-not-found' }

async function resolveUserByCookie(cookieHeader: string): Promise<AuthResolution> {
  const supabase = createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll: () => parseCookieHeader(cookieHeader),
        setAll() {},
      },
    },
  )
  const { data: claimsData, error } = await supabase.auth.getClaims()
  const supabaseId = claimsData?.claims.sub
  if (error || !supabaseId) return { status: 'unauthorized' }

  const user = await prisma.user.findUnique({ where: { supabaseId } })
  return user ? { status: 'authenticated', user } : { status: 'user-not-found' }
}

export const getUserByCookie = cache(resolveUserByCookie)
