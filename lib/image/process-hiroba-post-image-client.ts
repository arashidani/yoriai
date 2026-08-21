import imageCompression from 'browser-image-compression'
import {
  HIROBA_POST_IMAGE_MAX_BYTES,
  HIROBA_POST_IMAGE_MAX_MB,
  HIROBA_POST_IMAGE_MAX_SIZE,
  HIROBA_POST_IMAGE_TOO_LARGE_MESSAGE,
} from '@/lib/image/hiroba-post-image-limits'

export const ACCEPTED_HIROBA_POST_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

export class HirobaPostImageClientValidationError extends Error {}
export class HirobaPostImageClientProcessingError extends Error {}

export async function prepareHirobaPostImageForUpload(file: File): Promise<File> {
  if (!ACCEPTED_HIROBA_POST_IMAGE_TYPES.includes(file.type)) {
    throw new HirobaPostImageClientValidationError(
      '対応していない画像形式です（JPEG, PNG, WebP, GIFのいずれかを選択してください）',
    )
  }
  if (file.size <= HIROBA_POST_IMAGE_MAX_BYTES) return file

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: HIROBA_POST_IMAGE_MAX_MB,
      maxWidthOrHeight: HIROBA_POST_IMAGE_MAX_SIZE,
      fileType: 'image/webp',
      initialQuality: 0.9,
      useWebWorker: true,
    })
    if (compressed.size > HIROBA_POST_IMAGE_MAX_BYTES) {
      throw new HirobaPostImageClientValidationError(HIROBA_POST_IMAGE_TOO_LARGE_MESSAGE)
    }
    return new File([compressed], 'hiroba-post.webp', {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } catch (error) {
    if (error instanceof HirobaPostImageClientValidationError) throw error
    throw new HirobaPostImageClientProcessingError('画像の圧縮に失敗しました')
  }
}
