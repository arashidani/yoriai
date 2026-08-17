import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminClientMock, createSupabaseAdminClientMock } = vi.hoisted(() => {
  const storageBucketMock = {
    upload: vi.fn(),
    remove: vi.fn(),
    getPublicUrl: vi.fn(),
  }
  return {
    adminClientMock: {
      storage: { from: vi.fn(() => storageBucketMock) },
      bucket: storageBucketMock,
    },
    createSupabaseAdminClientMock: vi.fn(),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import {
  AVATAR_BUCKET,
  AvatarUploadError,
  deleteAvatar,
  uploadAvatar,
} from '@/lib/supabase/storage/avatar'

describe('uploadAvatar / deleteAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseAdminClientMock.mockReturnValue(adminClientMock)
    adminClientMock.bucket.upload.mockResolvedValue({ error: null })
    adminClientMock.bucket.remove.mockResolvedValue({ error: null })
    adminClientMock.bucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/profiles/user-1.webp' },
    })
  })

  it('固定パスにupsertでアップロードし、キャッシュバスティング付きURLを返す', async () => {
    const url = await uploadAvatar('user-1', Buffer.from('image-bytes'))

    expect(adminClientMock.storage.from).toHaveBeenCalledWith(AVATAR_BUCKET)
    expect(adminClientMock.bucket.upload).toHaveBeenCalledWith(
      'user-1.webp',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/webp', upsert: true }),
    )
    expect(url).toMatch(/^https:\/\/storage\.example\.com\/profiles\/user-1\.webp\?v=\d+$/)
  })

  it('アップロード失敗時はAvatarUploadErrorを投げる', async () => {
    adminClientMock.bucket.upload.mockResolvedValue({ error: { message: 'boom' } })

    await expect(uploadAvatar('user-1', Buffer.from('x'))).rejects.toThrow(AvatarUploadError)
  })

  it('deleteAvatarは固定パスのオブジェクトを削除する', async () => {
    await deleteAvatar('user-1')

    expect(adminClientMock.bucket.remove).toHaveBeenCalledWith(['user-1.webp'])
  })

  it('削除失敗時はAvatarUploadErrorを投げる', async () => {
    adminClientMock.bucket.remove.mockResolvedValue({ error: { message: 'boom' } })

    await expect(deleteAvatar('user-1')).rejects.toThrow(AvatarUploadError)
  })
})
