import { cache } from 'react'
import { getUserBySupabaseId } from '@/lib/auth/user-lookup'
import { MOCK_USERS } from '@/lib/mocks/fixtures'
import { createClient } from '@/lib/supabase/server'

export const getCurrentUser = cache(async () => {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_USERS[0]
  }

  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const supabaseId = claimsData?.claims.sub
  if (claimsError || !supabaseId) return null

  return getUserBySupabaseId(supabaseId)
})
