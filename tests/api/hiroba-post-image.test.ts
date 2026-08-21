import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { hirobaPost: { findFirst: vi.fn(), update: vi.fn() } },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')
  return {
    authMiddleware: createMiddleware(async (c, next) => {
      c.set('user', MOCK_USERS[0])
      await next()
    }),
  }
})

const { processImageMock } = vi.hoisted(() => ({ processImageMock: vi.fn() }))
vi.mock('@/lib/image/process-hiroba-post-image', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/image/process-hiroba-post-image')>()
  return { ...actual, processHirobaPostImage: processImageMock }
})

const { uploadImageMock } = vi.hoisted(() => ({ uploadImageMock: vi.fn() }))
vi.mock('@/lib/supabase/storage/hiroba-post-image', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase/storage/hiroba-post-image')>()
  return { ...actual, uploadHirobaPostImage: uploadImageMock }
})

import app from '@/lib/hono/app'

const post = {
  id: 'hiroba-post-1',
  hirobaId: 'hiroba-alcohol',
  title: 'タイトル',
  body: '本文',
  imageUrl: null,
  authorId: 'user-1',
  idempotencyKey: null,
  answerCount: 0,
  likeCount: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function requestImage() {
  const form = new FormData()
  form.append('file', new Blob(['image'], { type: 'image/jpeg' }), 'image.jpg')
  return app.request('/api/hiroba-posts/hiroba-post-1/image', { method: 'PUT', body: form })
}

describe('ひろば投稿画像アップロードAPI', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.hirobaPost.findFirst.mockResolvedValue(post)
    prismaMock.hirobaPost.update.mockImplementation(({ data }: { data: { imageUrl: string } }) => ({
      ...post,
      ...data,
    }))
    processImageMock.mockResolvedValue(Buffer.from('processed-webp'))
    uploadImageMock.mockResolvedValue(
      'https://storage.example.com/posts/hiroba-posts/hiroba-post-1.webp?v=1',
    )
  })

  it('投稿者が画像をアップロードすると投稿にURLを保存する', async () => {
    const response = await requestImage()

    expect(response.status).toBe(200)
    expect(uploadImageMock).toHaveBeenCalledWith('hiroba-post-1', expect.any(Buffer))
    expect(prismaMock.hirobaPost.update).toHaveBeenCalledWith({
      where: { id: 'hiroba-post-1' },
      data: {
        imageUrl: 'https://storage.example.com/posts/hiroba-posts/hiroba-post-1.webp?v=1',
      },
    })
    expect((await response.json()).post.imageUrl).toContain('hiroba-post-1.webp')
  })

  it('投稿者以外の画像アップロードを拒否する', async () => {
    prismaMock.hirobaPost.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: post.id })

    const response = await requestImage()

    expect(response.status).toBe(403)
    expect(uploadImageMock).not.toHaveBeenCalled()
  })
})
