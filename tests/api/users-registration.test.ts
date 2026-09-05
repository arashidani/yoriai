import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/app/generated/prisma/enums'
import { COMPANY_EMAIL_ERROR } from '@/lib/schemas/register'

const AUTH_USER_ID = 'auth-user-new'

const { adminClientMock, createServerClientMock, createSupabaseAdminClientMock, prismaMock, txMock } =
  vi.hoisted(() => {
    const tx = {
      invite: {
        updateMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      user: {
        create: vi.fn(),
      },
    }
    return {
      adminClientMock: {
        auth: {
          admin: {
            deleteUser: vi.fn(),
            updateUserById: vi.fn(),
          },
        },
      },
      createServerClientMock: vi.fn(),
      createSupabaseAdminClientMock: vi.fn(),
      txMock: tx,
      prismaMock: {
        user: {
          findUnique: vi.fn(),
        },
        $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      },
    }
  })

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import app from '@/lib/hono/app'

const validAuthUser = {
  id: AUTH_USER_ID,
  email: 'taro@ibjapan.jp',
  user_metadata: { name: '山田太郎' },
}

const createdUser = {
  id: 'user-new',
  supabaseId: AUTH_USER_ID,
  email: 'taro@ibjapan.jp',
  name: '山田太郎',
  username: null,
  displayNameColor: null,
  avatarUrl: null,
  role: Role.USER,
  createdAt: new Date('2024-01-01'),
}

function postUsers(body: { name?: string; inviteToken: string }) {
  return app.request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/users 登録補償削除', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: validAuthUser } }),
      },
    })
    createSupabaseAdminClientMock.mockReturnValue(adminClientMock)
    adminClientMock.auth.admin.deleteUser.mockResolvedValue({ error: null })
    adminClientMock.auth.admin.updateUserById.mockResolvedValue({ error: null })
    prismaMock.user.findUnique.mockResolvedValue(null)
    txMock.invite.updateMany.mockResolvedValue({ count: 1 })
    txMock.invite.findUniqueOrThrow.mockResolvedValue({
      token: 'valid-token',
      name: '招待ユーザー',
      role: Role.USER,
    })
    txMock.user.create.mockResolvedValue(createdUser)
  })

  it('招待が無効な場合は400を返し、Authユーザーを補償削除する', async () => {
    txMock.invite.updateMany.mockResolvedValue({ count: 0 })

    const response = await postUsers({ name: '山田太郎', inviteToken: 'invalid-token' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: '招待リンクが無効です' })
    expect(adminClientMock.auth.admin.deleteUser).toHaveBeenCalledWith(AUTH_USER_ID)
  })

  it('メールドメインが不正な場合は400を返し、Authユーザーを補償削除する', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { ...validAuthUser, email: 'taro@example.com' } },
        }),
      },
    })

    const response = await postUsers({ name: '山田太郎', inviteToken: 'valid-token' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: COMPANY_EMAIL_ERROR })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(adminClientMock.auth.admin.deleteUser).toHaveBeenCalledWith(AUTH_USER_ID)
  })

  it('既存のPrisma Userがある場合は200を返し、Authユーザーを削除しない', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createdUser)

    const response = await postUsers({ name: '山田太郎', inviteToken: 'valid-token' })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).toMatchObject({ ...createdUser, createdAt: expect.any(String) })
    expect(adminClientMock.auth.admin.deleteUser).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('登録成功時は201を返し、Authユーザーを削除しない', async () => {
    const response = await postUsers({ name: '山田太郎', inviteToken: 'valid-token' })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.user).toMatchObject({ ...createdUser, createdAt: expect.any(String) })
    expect(adminClientMock.auth.admin.deleteUser).not.toHaveBeenCalled()
    expect(adminClientMock.auth.admin.updateUserById).toHaveBeenCalledWith(AUTH_USER_ID, {
      app_metadata: { role: Role.USER },
    })
  })

  it('Prisma保存に失敗した場合は500を返し、Authユーザーを補償削除する', async () => {
    prismaMock.$transaction.mockRejectedValue(new Error('db unavailable'))

    const response = await postUsers({ name: '山田太郎', inviteToken: 'valid-token' })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'ユーザー情報の保存に失敗しました' })
    expect(adminClientMock.auth.admin.deleteUser).toHaveBeenCalledWith(AUTH_USER_ID)
  })
})
