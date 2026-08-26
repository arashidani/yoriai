import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    department: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    businessArea: { findMany: vi.fn(), update: vi.fn() },
    businessSkill: { findMany: vi.fn(), update: vi.fn() },
    interest: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
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

import app from '@/lib/hono/app'

const reorder = (orderedIds: string[]) =>
  app.request('/api/admin/profile-options/departments/order', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })

describe('管理者プロフィール選択肢API', () => {
  beforeAll(() => vi.stubEnv('MOCK_MODE', 'false'))

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.department.findMany.mockResolvedValue([
      { id: 'department-1' },
      { id: 'department-2' },
    ])
    prismaMock.department.update.mockResolvedValue({})
  })

  it('保存された並び順で一覧を取得する', async () => {
    prismaMock.department.findMany.mockResolvedValue([])

    const response = await app.request('/api/admin/profile-options/departments')

    expect(response.status).toBe(200)
    expect(prismaMock.department.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  })

  it('指定された順番を連番で保存する', async () => {
    const response = await reorder(['department-2', 'department-1'])

    expect(response.status).toBe(200)
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock.department.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'department-2' },
      data: { sortOrder: 0 },
    })
    expect(prismaMock.department.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'department-1' },
      data: { sortOrder: 1 },
    })
  })

  it('存在しない項目を含む並び順は保存しない', async () => {
    const response = await reorder(['department-2', 'missing'])

    expect(response.status).toBe(400)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})
