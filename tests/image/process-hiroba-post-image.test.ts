import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  HIROBA_POST_IMAGE_MAX_BYTES,
  HIROBA_POST_IMAGE_MAX_SIZE,
} from '@/lib/image/hiroba-post-image-limits'
import {
  processHirobaPostImage,
  UnsupportedHirobaPostImageError,
} from '@/lib/image/process-hiroba-post-image'

async function makeTestImage(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 50, b: 50 } },
  })
    .jpeg()
    .toBuffer()
}

describe('processHirobaPostImage', () => {
  it('縦横比を保ったWebPに変換する', async () => {
    const output = await processHirobaPostImage(await makeTestImage(2400, 1200))
    const metadata = await sharp(output).metadata()

    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(HIROBA_POST_IMAGE_MAX_SIZE)
    expect(metadata.height).toBe(800)
  })

  it('出力サイズは上限以下になる', async () => {
    const output = await processHirobaPostImage(await makeTestImage(3000, 3000))
    expect(output.byteLength).toBeLessThanOrEqual(HIROBA_POST_IMAGE_MAX_BYTES)
  })

  it('非画像バイナリを拒否する', async () => {
    await expect(processHirobaPostImage(Buffer.from('not an image'))).rejects.toThrow(
      UnsupportedHirobaPostImageError,
    )
  })
})
