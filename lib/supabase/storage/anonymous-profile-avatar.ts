import { randomUUID } from 'node:crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const AVATAR_BUCKET = 'profiles'

export class AnonymousProfileAvatarUploadError extends Error {}

export async function uploadAnonymousProfileAvatar(
  profileId: string,
  image: Buffer,
): Promise<string> {
  const admin = createSupabaseAdminClient()
  const path = `anonymous-profiles/${profileId}/${randomUUID()}.webp`
  const { error } = await admin.storage.from(AVATAR_BUCKET).upload(path, image, {
    contentType: 'image/webp',
  })
  if (error) throw new AnonymousProfileAvatarUploadError(error.message)

  return admin.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}
