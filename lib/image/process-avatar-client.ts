import imageCompression from 'browser-image-compression'

export const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const AVATAR_UPLOAD_MAX_BYTES = 4.5 * 1024 * 1024

const TARGET_SIZE = 512
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
  if (error instanceof Error && error.message.includes('The file given is not an instance of Blob or File')) {
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

  if (file.size <= AVATAR_UPLOAD_MAX_BYTES) return file

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: AVATAR_UPLOAD_MAX_BYTES / (1024 * 1024),
      maxWidthOrHeight: TARGET_SIZE,
      fileType: OUTPUT_MIME_TYPE,
      initialQuality: 0.9,
      useWebWorker: true,
    })

    if (compressed.size > AVATAR_UPLOAD_MAX_BYTES) {
      throw new AvatarClientValidationError('ファイルサイズが大きすぎます（4.5MB以下にしてください）')
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
