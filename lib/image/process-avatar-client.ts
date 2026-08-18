import imageCompression from 'browser-image-compression'
import {
  AVATAR_MAX_BYTES,
  AVATAR_MAX_MB,
  AVATAR_SIZE,
  AVATAR_TOO_LARGE_MESSAGE,
} from '@/lib/image/avatar-limits'

export const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const OUTPUT_MIME_TYPE = 'image/webp'

export class AvatarClientValidationError extends Error {}
export class AvatarClientProcessingError extends Error {}

function createOutputFileName(originalName: string) {
  const dotIndex = originalName.lastIndexOf('.')
  const baseName = dotIndex >= 0 ? originalName.slice(0, dotIndex) : originalName
  return `${baseName || 'avatar'}.webp`
}

function toValidationError(error: unknown) {
  if (error instanceof AvatarClientValidationError) return error
  if (
    error instanceof Error &&
    error.message.includes('The file given is not an instance of Blob or File')
  ) {
    return new AvatarClientValidationError(
      '対応していない画像形式です（JPEG, PNG, WebP, GIFのいずれかを選択してください）',
    )
  }
  return null
}

function toProcessingError(error: unknown) {
  try {
    if (error instanceof Error) {
      return new AvatarClientProcessingError(error.message)
    }
    return new AvatarClientProcessingError('画像の圧縮に失敗しました')
  } catch {
    return new AvatarClientProcessingError('画像の圧縮に失敗しました')
  }
}

export async function prepareAvatarFileForUpload(file: File): Promise<File> {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    throw new AvatarClientValidationError(
      '対応していない画像形式です（JPEG, PNG, WebP, GIFのいずれかを選択してください）',
    )
  }

  if (file.size <= AVATAR_MAX_BYTES) return file

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: AVATAR_MAX_MB,
      maxWidthOrHeight: AVATAR_SIZE,
      fileType: OUTPUT_MIME_TYPE,
      initialQuality: 0.9,
      useWebWorker: true,
    })

    if (compressed.size > AVATAR_MAX_BYTES) {
      throw new AvatarClientValidationError(AVATAR_TOO_LARGE_MESSAGE)
    }

    return new File([compressed], createOutputFileName(file.name), {
      type: OUTPUT_MIME_TYPE,
      lastModified: Date.now(),
    })
  } catch (error) {
    const validationError = toValidationError(error)
    if (validationError) throw validationError
    throw toProcessingError(error)
  }
}
