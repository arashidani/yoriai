import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // NEXT_PUBLIC_* はビルド時にリテラルの process.env.XXX を静的置換して
  // クライアントバンドルへインライン化される。requireEnv の動的アクセス
  // (process.env[name]) では置換されず、ブラウザ上で undefined になるため、
  // ここでは必ず静的プロパティアクセスで参照する。
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }
  return createBrowserClient(url, anonKey)
}
