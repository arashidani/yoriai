import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { AVATAR_BUCKET } from '@/lib/supabase/storage/avatar'

export class HirobaPostImageUploadError extends Error {}

function imagePath(postId: string) {
  return `hiroba-posts/${postId}.webp`
}

/** プロフィール画像と同じ公開バケットを、ひろば投稿専用プレフィックスで利用する。 */
export async function uploadHirobaPostImage(postId: string, image: Buffer): Promise<string> {
  const admin = createSupabaseAdminClient()
  const path = imagePath(postId)
  const { error } = await admin.storage.from(AVATAR_BUCKET).upload(path, image, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new HirobaPostImageUploadError(error.message)

  const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
