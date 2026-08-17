import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/** アバター画像を保存する公開バケット名。Supabase プロジェクト側で事前作成が必要 */
export const AVATAR_BUCKET = 'profiles'

/** Supabase Storage へのアップロード・削除に失敗した場合 */
export class AvatarUploadError extends Error {}

function avatarPath(userId: string): string {
  return `${userId}.webp`
}

/**
 * ユーザーごとに固定パスへ upsert する。差し替え時に旧ファイルの削除処理が不要になる。
 * 公開URLにタイムスタンプを付与し、CDN/ブラウザキャッシュを新しい画像で確実に上書きする。
 */
export async function uploadAvatar(userId: string, image: Buffer): Promise<string> {
  const admin = createSupabaseAdminClient()
  const path = avatarPath(userId)

  const { error } = await admin.storage.from(AVATAR_BUCKET).upload(path, image, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new AvatarUploadError(error.message)

  const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function deleteAvatar(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)])
  // ファイルが既に存在しない場合(404)は「アバターが無い」という目的が既に達成されているので正常系として扱う
  if (error && error.status !== 404) throw new AvatarUploadError(error.message)
}
