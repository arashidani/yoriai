import { isServer, QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR 直後にクライアントが即 refetch すると HTML と初回描画がずれやすい
        staleTime: 60_000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * サーバーではリクエストごとに新しい QueryClient を返す。
 * モジュールシングルトンだと前リクエストのキャッシュが HTML に混ざり、
 * hydration mismatch とユーザー間のデータ混線の原因になる。
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
