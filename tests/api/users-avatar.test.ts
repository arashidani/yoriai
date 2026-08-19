import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { user: { update: vi.fn() } },
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

const { processAvatarImageMock } = vi.hoisted(() => ({ processAvatarImageMock: vi.fn() }))

vi.mock('@/lib/image/process-avatar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/image/process-avatar')>()
  return { ...actual, processAvatarImage: processAvatarImageMock }
})

const { uploadAvatarMock, deleteAvatarMock } = vi.hoisted(() => ({
  uploadAvatarMock: vi.fn(),
  deleteAvatarMock: vi.fn(),
}))

vi.mock('@/lib/supabase/storage/avatar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase/storage/avatar')>()
  return { ...actual, uploadAvatar: uploadAvatarMock, deleteAvatar: deleteAvatarMock }
})

import app from '@/lib/hono/app'
import { AvatarProcessingError, UnsupportedImageError } from '@/lib/image/process-avatar'
import { AvatarUploadError } from '@/lib/supabase/storage/avatar'

function multipartRequest(path: string, file?: { name: string; content: string; type: string }) {
  const form = new FormData()
  if (file) form.append('file', new Blob([file.content], { type: file.type }), file.name)
  return app.request(path, { method: 'PUT', body: form })
}

describe('アバターアップロードAPI', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    processAvatarImageMock.mockResolvedValue(Buffer.from('processed-webp'))
    uploadAvatarMock.mockResolvedValue('https://storage.example.com/profiles/user-1.webp?v=1')
    prismaMock.user.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...MOCK_USERS[0], ...data }),
    )
  })

  it('画像を処理してアップロードし、更新後のユーザーを返す', async () => {
    const response = await multipartRequest('/api/users/me/avatar', {
      name: 'avatar.jpg',
      content: 'fake-image-bytes',
      type: 'image/jpeg',
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user.avatarUrl).toBe('https://storage.example.com/profiles/user-1.webp?v=1')
    expect(uploadAvatarMock).toHaveBeenCalledWith('user-1', expect.any(Buffer))
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { avatarUrl: 'https://storage.example.com/profiles/user-1.webp?v=1' },
    })
  })

  it('fileが無い場合は400', async () => {
    const response = await multipartRequest('/api/users/me/avatar')

    expect(response.status).toBe(400)
    expect(uploadAvatarMock).not.toHaveBeenCalled()
  })

  it('非対応の画像形式はUnsupportedImageErrorを400に変換する', async () => {
    processAvatarImageMock.mockRejectedValue(
      new UnsupportedImageError('対応していない画像形式です'),
    )

    const response = await multipartRequest('/api/users/me/avatar', {
      name: 'not-image.txt',
      content: 'plain text',
      type: 'text/plain',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: '対応していない画像形式です' })
    expect(uploadAvatarMock).not.toHaveBeenCalled()
  })

  it('変換後も上限を超える場合はAvatarProcessingErrorを422に変換する', async () => {
    processAvatarImageMock.mockRejectedValue(
      new AvatarProcessingError('画像を処理できませんでした'),
    )

    const response = await multipartRequest('/api/users/me/avatar', {
      name: 'huge.jpg',
      content: 'x',
      type: 'image/jpeg',
    })

    expect(response.status).toBe(422)
  })

  it('Storageアップロード失敗はAvatarUploadErrorを502に変換する', async () => {
    uploadAvatarMock.mockRejectedValue(new AvatarUploadError('boom'))

    const response = await multipartRequest('/api/users/me/avatar', {
      name: 'avatar.jpg',
      content: 'fake-image-bytes',
      type: 'image/jpeg',
    })

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: '画像のアップロードに失敗しました' })
  })
})

describe('アバター削除API', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    deleteAvatarMock.mockResolvedValue(undefined)
    prismaMock.user.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...MOCK_USERS[0], ...data }),
    )
  })

  it('Storageのオブジェクトを削除し、avatarUrlをnullにする', async () => {
    const response = await app.request('/api/users/me/avatar', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(deleteAvatarMock).toHaveBeenCalledWith('user-1')
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { avatarUrl: null },
    })
    expect((await response.json()).user.avatarUrl).toBeNull()
  })

  it('削除失敗時は502', async () => {
    deleteAvatarMock.mockRejectedValue(new AvatarUploadError('boom'))

    const response = await app.request('/api/users/me/avatar', { method: 'DELETE' })

    expect(response.status).toBe(502)
  })
})
