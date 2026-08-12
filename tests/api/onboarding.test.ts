import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'

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
      department: { findMany: vi.fn() },
      businessArea: { findMany: vi.fn() },
      businessSkill: { findMany: vi.fn() },
      interest: { findMany: vi.fn() },
      $transaction: vi.fn(async (callback: (transaction: TransactionMock) => unknown) =>
        callback(tx),
      ),
    },
  }
})

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

import app from '@/lib/hono/app'

const input = {
  username: 'みどりさん',
  departmentId: 'department-1',
  businessAreaId: 'business-area-1',
  joinedYear: 2024,
  joinedMonth: 4,
  businessSkillIds: ['skill-1'],
  interestIds: ['interest-1'],
  lunchPreference: LunchPreference.NO_PREFERENCE,
  recommendedLunchSpot: '',
  bio: '',
  displayNameColor: DisplayNameColor.GREEN,
}

const request = (body = input) =>
  app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('オンボーディング完了API', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    txMock.department.findFirst.mockResolvedValue({ id: 'department-1' })
    txMock.businessArea.findFirst.mockResolvedValue({ id: 'business-area-1' })
    txMock.businessSkill.count.mockResolvedValue(1)
    txMock.interest.count.mockResolvedValue(1)
    prismaMock.department.findMany.mockResolvedValue([])
    prismaMock.businessArea.findMany.mockResolvedValue([])
    prismaMock.businessSkill.findMany.mockResolvedValue([])
    prismaMock.interest.findMany.mockResolvedValue([])
  })

  it('有効項目に加えて現在選択中の無効項目を取得する', async () => {
    const response = await app.request('/api/onboarding/options')

    expect(response.status).toBe(200)
    expect(prismaMock.department.findMany).toHaveBeenCalledWith({
      where: { OR: [{ isActive: true }, { users: { some: { id: 'user-1' } } }] },
      orderBy: { name: 'asc' },
    })
    expect(prismaMock.businessSkill.findMany).toHaveBeenCalledWith({
      where: { OR: [{ isActive: true }, { users: { some: { userId: 'user-1' } } }] },
      orderBy: { name: 'asc' },
    })
  })

  it('無効なマスタ項目が含まれる場合は保存しない', async () => {
    txMock.department.findFirst.mockResolvedValue(null)

    const response = await request()

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: '選択した項目が無効です' })
    expect(txMock.user.update).not.toHaveBeenCalled()
  })

  it('全項目と複数選択を1トランザクションで保存する', async () => {
    const response = await request()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          username: 'みどりさん',
          recommendedLunchSpot: null,
          bio: null,
          businessSkills: {
            deleteMany: {},
            create: [{ businessSkillId: 'skill-1' }],
          },
          interests: { deleteMany: {}, create: [{ interestId: 'interest-1' }] },
        }),
      }),
    )
  })
})
