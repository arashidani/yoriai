import { prisma } from '@/lib/prisma/client'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * 登録途中で Prisma User が作られなかった Auth ユーザーを補償削除する。
 * 既に Prisma User が存在する場合は何もしない。
 */
export async function rollbackOrphanedAuthUser(supabaseId: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { supabaseId } })
  if (existing) return

  const supabaseAdmin = createSupabaseAdminClient()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(supabaseId)
  if (error) {
    console.error('Failed to rollback orphaned auth user:', supabaseId, error.message)
  }
}
