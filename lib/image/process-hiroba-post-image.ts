import sharp from 'sharp'
import {
  HIROBA_POST_IMAGE_MAX_BYTES,
  HIROBA_POST_IMAGE_MAX_SIZE,
} from '@/lib/image/hiroba-post-image-limits'

export class UnsupportedHirobaPostImageError extends Error {}
export class HirobaPostImageProcessingError extends Error {}

/** 向きを補正し、縦横比を保ったまま最大1600pxのWebPに変換する。 */
export async function processHirobaPostImage(input: Buffer): Promise<Buffer> {
  for (const quality of [80, 60, 40]) {
    let output: Buffer
    try {
      output = await sharp(input)
        .rotate()
        .resize(HIROBA_POST_IMAGE_MAX_SIZE, HIROBA_POST_IMAGE_MAX_SIZE, { fit: 'inside' })
        .webp({ quality })
        .toBuffer()
    } catch {
      throw new UnsupportedHirobaPostImageError('対応していない画像形式です')
    }
    if (output.byteLength <= HIROBA_POST_IMAGE_MAX_BYTES) return output
  }
  throw new HirobaPostImageProcessingError('画像を処理できませんでした')
}
