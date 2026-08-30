import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    anonymousProfile: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')
  const { MOCK_USERS } = await import('@/lib/mocks/fixtures')

  return {
    authMiddleware: createMiddleware(async (c, next) => {
      c.set('user', MOCK_USERS[0])
      await next()
    }),
  }
})

import { Prisma } from '@/app/generated/prisma/client'
import app from '@/lib/hono/app'

function knownRequestError(code: string, message: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: '7.9.0',
    meta,
  })
}

function postProfile(displayName: string) {
  return app.request('/api/admin/anonymous-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  })
}

describe('匿名キャラ登録API', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('新しい表示名なら201で作成する', async () => {
    prismaMock.anonymousProfile.create.mockResolvedValue({
      id: 'profile-1',
      displayName: 'うさぎ',
      avatarUrls: [],
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    const response = await postProfile('うさぎ')

    expect(response.status).toBe(201)
    expect((await response.json()).profile.displayName).toBe('うさぎ')
  })

  it('同じ表示名がすでに存在する場合は409を返す', async () => {
    prismaMock.anonymousProfile.create.mockRejectedValue(
      knownRequestError('P2002', 'Unique constraint failed on the fields: (`displayName`)', {
        target: ['displayName'],
      }),
    )

    const response = await postProfile('うさぎ')

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: '同じ表示名の匿名キャラがすでに登録されています',
    })
  })

  it('制約名形式のtargetでも409として扱う', async () => {
    prismaMock.anonymousProfile.create.mockRejectedValue(
      knownRequestError('P2002', 'Unique constraint failed', {
        target: 'AnonymousProfile_displayName_key',
      }),
    )

    const response = await postProfile('うさぎ')

    expect(response.status).toBe(409)
  })

  it('displayName以外の一意制約違反は重複登録エラーにしない', async () => {
    prismaMock.anonymousProfile.create.mockRejectedValue(
      knownRequestError('P2002', 'Unique constraint failed on the fields: (`id`)', {
        target: ['id'],
      }),
    )

    const response = await postProfile('うさぎ')

    expect(response.status).not.toBe(409)
  })

  it('予期しないDBエラーは重複登録エラーにしない', async () => {
    prismaMock.anonymousProfile.create.mockRejectedValue(
      knownRequestError('P2024', 'Timed out fetching a connection from the pool'),
    )

    const response = await postProfile('うさぎ')

    expect(response.status).not.toBe(409)
  })
})
