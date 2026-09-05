import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthVariables } from '@/lib/hono/middleware/auth'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { createClientMock, createServerClientMock, getClaimsMock, getUserBySupabaseIdMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    createServerClientMock: vi.fn(),
    getClaimsMock: vi.fn(),
    getUserBySupabaseIdMock: vi.fn(),
  }))

vi.mock('@/lib/auth/user-lookup', () => ({
  getUserBySupabaseId: getUserBySupabaseIdMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

const { getCurrentUser } = await import('@/lib/auth/current-user')
const { authMiddleware } = await import('@/lib/hono/middleware/auth')

const app = new Hono<{ Variables: AuthVariables }>().get('/protected', authMiddleware, (c) =>
  c.json({ userId: c.var.user.id }),
)

describe('RSCとauthMiddlewareのユーザー解決', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    const auth = { getClaims: getClaimsMock, getUser: vi.fn() }
    createClientMock.mockResolvedValue({ auth })
    createServerClientMock.mockReturnValue({ auth })
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: MOCK_USERS[1].supabaseId } },
      error: null,
    })
    getUserBySupabaseIdMock.mockResolvedValue(MOCK_USERS[1])
  })

  // React cache()による重複排除は、両者が同じ関数を同じキーで呼ぶことが前提になる。
  it('どちらも同じgetUserBySupabaseIdを検証済みsubで呼ぶ', async () => {
    await getCurrentUser()
    const response = await app.request('/protected', {
      headers: { cookie: 'sb-example-auth-token=test-session' },
    })

    expect(response.status).toBe(200)
    expect(getUserBySupabaseIdMock).toHaveBeenCalledTimes(2)
    expect(getUserBySupabaseIdMock).toHaveBeenNthCalledWith(1, MOCK_USERS[1].supabaseId)
    expect(getUserBySupabaseIdMock).toHaveBeenNthCalledWith(2, MOCK_USERS[1].supabaseId)
  })
})
