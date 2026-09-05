import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

const { createClientMock, findUniqueMock, getClaimsMock, getUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  findUniqueMock: vi.fn(),
  getClaimsMock: vi.fn(),
  getUserMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}))

const { getCurrentUser } = await import('@/lib/auth/current-user')

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MOCK_MODE', 'false')
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: getClaimsMock,
        getUser: getUserMock,
      },
    })
    getUserMock.mockResolvedValue({ data: { user: { id: MOCK_USERS[1].supabaseId } } })
  })

  it('JWTをローカル検証し、Supabase Authへの往復なしでユーザーを解決する', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: MOCK_USERS[1].supabaseId } },
      error: null,
    })
    findUniqueMock.mockResolvedValue(MOCK_USERS[1])

    await expect(getCurrentUser()).resolves.toEqual(MOCK_USERS[1])
    expect(getClaimsMock).toHaveBeenCalledOnce()
    expect(getUserMock).not.toHaveBeenCalled()
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { supabaseId: MOCK_USERS[1].supabaseId },
    })
  })

  it.each([
    ['署名が不正なJWT', { data: null, error: { message: 'Invalid JWT' } }],
    ['subがないJWT', { data: { claims: {} }, error: null }],
    ['未ログイン', { data: null, error: null }],
  ])('%sではnullを返し、DBを引かない', async (_label, claimsResult) => {
    getClaimsMock.mockResolvedValue(claimsResult)

    await expect(getCurrentUser()).resolves.toBeNull()
    expect(findUniqueMock).not.toHaveBeenCalled()
  })

  it('MOCK_MODEではSupabaseとDBを呼ばずに従来のユーザーを返す', async () => {
    vi.stubEnv('MOCK_MODE', 'true')

    await expect(getCurrentUser()).resolves.toEqual(MOCK_USERS[0])
    expect(createClientMock).not.toHaveBeenCalled()
    expect(getClaimsMock).not.toHaveBeenCalled()
    expect(findUniqueMock).not.toHaveBeenCalled()
  })
})
