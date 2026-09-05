import { cache } from 'react'
import { prisma } from '@/lib/prisma/client'

/**
 * 検証済みJWTのsubからyoriaiユーザーを引く。
 *
 * RSC（getCurrentUser）とHonoのauthMiddlewareの双方がこの関数を経由することで、
 * 同一リクエスト内のfindUniqueがReact cache()で1回に集約される。
 * `lib/hono/server-client.ts` はapp.fetchを直接呼ぶin-process呼び出しのため、
 * RSCと同じReactリクエストスコープを共有できる。
 *
 * キーは検証済みJWTのsubのみ。識別情報を受け渡す経路を作らないため、
 * ヘッダ詐称による認証バイパスは原理的に発生しない。
 */
export const getUserBySupabaseId = cache((supabaseId: string) =>
  prisma.user.findUnique({ where: { supabaseId } }),
)
