import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { proxy } from '@/proxy'

const { createServerClientMock, getClaimsMock, getUserMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getClaimsMock: vi.fn(),
  getUserMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

function request(path: string) {
  return new NextRequest(`https://yoriai.example${path}`)
}

describe('proxy authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('MOCK_AUTH_BYPASS', 'false')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: getClaimsMock,
        getUser: getUserMock,
      },
    })
  })

  it('APIリクエストでもJWTをローカル検証し、getUser通信を行わない', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: 'supabase-user-1', app_metadata: { role: 'USER' } } },
      error: null,
    })

    const response = await proxy(request('/api/questions/post-1/like'))

    expect(response.status).toBe(200)
    expect(getClaimsMock).toHaveBeenCalledOnce()
    expect(getUserMock).not.toHaveBeenCalled()
  })

  it('無効なJWTで保護ページへアクセスした場合はログイン画面へ戻す', async () => {
    getClaimsMock.mockResolvedValue({ data: null, error: { message: 'Invalid JWT' } })

    const response = await proxy(request('/my-questions'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://yoriai.example/login')
  })

  it('JWT内の管理者roleで管理画面へのアクセスを許可する', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: 'supabase-admin', app_metadata: { role: 'ADMIN' } } },
      error: null,
    })

    const response = await proxy(request('/admin'))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('JWT内のroleが一般ユーザーなら管理画面へのアクセスを拒否する', async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: 'supabase-user-1', app_metadata: { role: 'USER' } } },
      error: null,
    })

    const response = await proxy(request('/admin'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://yoriai.example/')
  })
})
