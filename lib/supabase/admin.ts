import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '@/lib/env'

/**
 * service role key を使うAdmin API専用クライアント。
 * ユーザーセッションを扱わないため @supabase/ssr の createServerClient は使わない。
 */
export function createSupabaseAdminClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )
}
