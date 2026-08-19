import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { AVATAR_MAX_BYTES, AVATAR_SIZE } from '@/lib/image/avatar-limits'
import {
  AvatarProcessingError,
  processAvatarImage,
  UnsupportedImageError,
} from '@/lib/image/process-avatar'

async function makeTestImage(options: {
  width: number
  height: number
  orientation?: number
}): Promise<Buffer> {
  const image = sharp({
    create: {
      width: options.width,
      height: options.height,
      channels: 3,
      background: { r: 200, g: 50, b: 50 },
    },
  })
  if (options.orientation) image.withMetadata({ orientation: options.orientation })
  return image.jpeg().toBuffer()
}

describe('processAvatarImage', () => {
  it('512x512のWebPにリサイズする', async () => {
    const input = await makeTestImage({ width: 1200, height: 800 })

    const output = await processAvatarImage(input)
    const metadata = await sharp(output).metadata()

    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(AVATAR_SIZE)
    expect(metadata.height).toBe(AVATAR_SIZE)
  })

  it('出力サイズは上限（AVATAR_MAX_BYTES）以下になる', async () => {
    const input = await makeTestImage({ width: 3000, height: 3000 })

    const output = await processAvatarImage(input)

    expect(output.byteLength).toBeLessThanOrEqual(AVATAR_MAX_BYTES)
  })

  it('EXIFの向き情報を反映してからリサイズする（回転後も正方形になる）', async () => {
    // orientation 6 = 90度回転。回転後もcoverクロップで正方形512x512になることだけ検証する
    const input = await makeTestImage({ width: 400, height: 200, orientation: 6 })

    const output = await processAvatarImage(input)
    const metadata = await sharp(output).metadata()

    expect(metadata.width).toBe(AVATAR_SIZE)
    expect(metadata.height).toBe(AVATAR_SIZE)
  })

  it('非画像バイナリはUnsupportedImageErrorを投げる', async () => {
    const input = Buffer.from('not an image')

    await expect(processAvatarImage(input)).rejects.toThrow(UnsupportedImageError)
  })
})

describe('AvatarProcessingError', () => {
  it('Errorのサブクラスである', () => {
    expect(new AvatarProcessingError('test')).toBeInstanceOf(Error)
  })
})
