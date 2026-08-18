import sharp from 'sharp'

// アップロード元ファイルの上限（AVATAR_ORIGINAL_MAX_BYTES, lib/hono/routes/users.ts）と統一
export const AVATAR_MAX_BYTES = 4.5 * 1024 * 1024
export const AVATAR_SIZE = 512

/** アップロードされたバイナリが画像としてデコードできない場合 */
export class UnsupportedImageError extends Error {}

/** リサイズ+WebP変換後も上限サイズに収まらない場合 */
export class AvatarProcessingError extends Error {}

/**
 * アバター画像を 512x512 の正方形（cover）にリサイズし、WebPに変換する。
 * EXIF の向き情報を反映してからクロップするため、スマホで撮った縦横回転済みの写真も正しい向きになる。
 */
export async function processAvatarImage(input: Buffer): Promise<Buffer> {
  const qualities = [80, 60, 40]
  for (const quality of qualities) {
    let output: Buffer
    try {
      output = await sharp(input)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .webp({ quality })
        .toBuffer()
    } catch {
      throw new UnsupportedImageError('対応していない画像形式です')
    }
    if (output.byteLength <= AVATAR_MAX_BYTES) return output
  }
  throw new AvatarProcessingError('画像を処理できませんでした')
}
