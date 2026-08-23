import { describe, expect, it, vi } from 'vitest'
import { isChatEnabled } from '@/lib/chat/availability'

describe('isChatEnabled', () => {
  it('MOCK_MODE=true のときは有効', () => {
    vi.stubEnv('MOCK_MODE', 'true')
    vi.stubEnv('DIFY_API_BASE_URL', '')
    vi.stubEnv('DIFY_API_KEY', '')

    expect(isChatEnabled()).toBe(true)
  })

  it('Dify の環境変数が揃っていれば有効', () => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('DIFY_API_BASE_URL', 'https://dify.example/v1')
    vi.stubEnv('DIFY_API_KEY', 'app-test')

    expect(isChatEnabled()).toBe(true)
  })

  it('未設定のときは無効', () => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('DIFY_API_BASE_URL', '')
    vi.stubEnv('DIFY_API_KEY', '')

    expect(isChatEnabled()).toBe(false)
  })
})
