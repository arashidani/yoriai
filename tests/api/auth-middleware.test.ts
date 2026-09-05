import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { createServerClientMock, findUniqueMock, getClaimsMock, getUserMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  findUniqueMock: vi.fn(),
  getClaimsMock: vi.fn(),
  getUserMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}))

const app = new Hono<{ Variables: AuthVariables }>().get('/protected', authMiddleware, (c) =>
  c.json({ userId: c.var.user.id }),
)

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: getClaimsMock,
        getUser: getUserMock,
      },
    })
    getUserMock.mockResolvedValue({ data: { user: { id: MOCK_USERS[1].supabaseId } } })
  })

  it('JWTをローカル検証し、subに対応するyoriaiユーザーを設定する', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: MOCK_USERS[1].supabaseId } },
      error: null,
    })
    findUniqueMock.mockResolvedValue(MOCK_USERS[1])

    const response = await app.request('/protected', {
      headers: { cookie: 'sb-example-auth-token=test-session' },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ userId: MOCK_USERS[1].id })
    expect(getClaimsMock).toHaveBeenCalledOnce()
    expect(getUserMock).not.toHaveBeenCalled()
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { supabaseId: MOCK_USERS[1].supabaseId },
    })
  })

  it.each(['署名が不正', '期限切れ'])('%sのJWTを401で拒否する', async () => {
    getClaimsMock.mockResolvedValue({
      data: null,
      error: { message: 'Invalid JWT' },
    })

    const response = await app.request('/protected')

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(findUniqueMock).not.toHaveBeenCalled()
  })

  it('subがないJWTを401で拒否する', async () => {
    getClaimsMock.mockResolvedValue({ data: { claims: {} }, error: null })

    const response = await app.request('/protected')

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(findUniqueMock).not.toHaveBeenCalled()
  })

  it('対応するyoriaiユーザーが存在しない場合は401を返す', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: 'deleted-supabase-user' } },
      error: null,
    })
    findUniqueMock.mockResolvedValue(null)

    const response = await app.request('/protected')

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'User not found' })
  })

  it('user idを詐称するヘッダを付けても401になる', async () => {
    getClaimsMock.mockResolvedValue({ data: null, error: { message: 'Invalid JWT' } })

    const response = await app.request('/protected', {
      headers: {
        'x-internal-user-id': MOCK_USERS[0].id,
        'x-user-id': MOCK_USERS[0].id,
        'x-supabase-user-id': MOCK_USERS[0].supabaseId,
      },
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(findUniqueMock).not.toHaveBeenCalled()
  })

  it('ヘッダで別ユーザーを指定してもJWTのsubが優先される', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: MOCK_USERS[1].supabaseId } },
      error: null,
    })
    findUniqueMock.mockResolvedValue(MOCK_USERS[1])

    const response = await app.request('/protected', {
      headers: {
        cookie: 'sb-example-auth-token=test-session',
        'x-internal-user-id': MOCK_USERS[0].id,
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ userId: MOCK_USERS[1].id })
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { supabaseId: MOCK_USERS[1].supabaseId },
    })
  })

  it('MOCK_MODEではSupabaseとDBを呼ばずに従来のユーザーを設定する', async () => {
    vi.stubEnv('MOCK_MODE', 'true')

    const response = await app.request('/protected')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ userId: MOCK_USERS[0].id })
    expect(createServerClientMock).not.toHaveBeenCalled()
    expect(getClaimsMock).not.toHaveBeenCalled()
    expect(findUniqueMock).not.toHaveBeenCalled()
  })
})
