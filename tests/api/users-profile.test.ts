import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

type TransactionMock = {
  department: { findFirst: ReturnType<typeof vi.fn> }
  businessArea: { findFirst: ReturnType<typeof vi.fn> }
  businessSkill: { count: ReturnType<typeof vi.fn> }
  interest: { count: ReturnType<typeof vi.fn> }
  user: { update: ReturnType<typeof vi.fn> }
}

const { prismaMock, txMock } = vi.hoisted(() => {
  const tx: TransactionMock = {
    department: { findFirst: vi.fn() },
    businessArea: { findFirst: vi.fn() },
    businessSkill: { count: vi.fn() },
    interest: { count: vi.fn() },
    user: { update: vi.fn() },
  }
  return {
    txMock: tx,
    prismaMock: {
      user: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (transaction: TransactionMock) => unknown) =>
        callback(tx),
      ),
    },
  }
})

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

import app from '@/lib/hono/app'

const input = {
  name: '山田 太郎',
  username: 'みどりさん',
  departmentId: 'department-1',
  businessAreaId: 'business-area-1',
  joinedYear: 2024,
  joinedMonth: 4,
  businessSkillIds: ['business-skill-1'],
  interestIds: ['interest-1'],
  lunchPreference: LunchPreference.NO_PREFERENCE,
  recommendedLunchSpot: '',
  bio: 'よろしくお願いします',
  displayNameColor: DisplayNameColor.GREEN,
}

describe('自分のプロフィールAPI', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      supabaseId: 'supabase-user-1',
      email: 'dev@example.com',
      name: '開発者',
      username: 'みどりさん',
      role: 'ADMIN',
      createdAt: new Date('2024-01-01'),
      departmentId: 'department-1',
      businessAreaId: 'business-area-1',
      joinedYear: 2020,
      joinedMonth: 4,
      lunchPreference: LunchPreference.NO_PREFERENCE,
      recommendedLunchSpot: null,
      bio: 'よろしくお願いします',
      displayNameColor: DisplayNameColor.GREEN,
      businessSkills: [{ businessSkillId: 'business-skill-1' }],
      interests: [{ interestId: 'interest-1' }],
    })
    txMock.department.findFirst.mockResolvedValue({ id: 'department-1' })
    txMock.businessArea.findFirst.mockResolvedValue({ id: 'business-area-1' })
    txMock.businessSkill.count.mockResolvedValue(1)
    txMock.interest.count.mockResolvedValue(1)
  })

  it('メールを含む自己紹介の全項目を取得する', async () => {
    const response = await app.request('/api/users/me')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      user: expect.objectContaining({
        email: 'dev@example.com',
        name: '開発者',
        username: 'みどりさん',
        departmentId: 'department-1',
        businessAreaId: 'business-area-1',
        joinedYear: 2020,
        joinedMonth: 4,
        businessSkillIds: ['business-skill-1'],
        interestIds: ['interest-1'],
        lunchPreference: LunchPreference.NO_PREFERENCE,
        recommendedLunchSpot: null,
        bio: 'よろしくお願いします',
        displayNameColor: DisplayNameColor.GREEN,
      }),
    })
  })

  it('プロフィールを更新してもメールは変更しない', async () => {
    const response = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, email: 'attacker@example.com' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    const update = txMock.user.update.mock.calls[0][0]
    expect(update.data).toEqual(expect.objectContaining({ name: '山田 太郎' }))
    expect(update.data).not.toHaveProperty('email')
    expect(txMock.department.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'department-1',
        OR: [{ isActive: true }, { users: { some: { id: 'user-1' } } }],
      },
    })
  })

  it('無効な選択肢を含む更新は保存しない', async () => {
    txMock.department.findFirst.mockResolvedValue(null)

    const response = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })

    expect(response.status).toBe(400)
    expect(txMock.user.update).not.toHaveBeenCalled()
  })
})
