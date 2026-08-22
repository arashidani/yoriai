import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const HIROBA_POST_IMAGE_BUCKET = 'posts'

export class HirobaPostImageUploadError extends Error {}

function imagePath(postId: string) {
  return `hiroba-posts/${postId}.webp`
}

/** ひろば投稿画像を専用の公開バケットにアップロードする。 */
export async function uploadHirobaPostImage(postId: string, image: Buffer): Promise<string> {
  const admin = createSupabaseAdminClient()
  const path = imagePath(postId)
  const { error } = await admin.storage.from(HIROBA_POST_IMAGE_BUCKET).upload(path, image, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new HirobaPostImageUploadError(error.message)

  const { data } = admin.storage.from(HIROBA_POST_IMAGE_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
