import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { authState, prismaMock } = vi.hoisted(() => ({
  authState: { userIndex: 0 as number | null },
  prismaMock: {
    invite: {
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

vi.mock('@/lib/hono/middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')
  const { MOCK_USERS } = await import('@/lib/mocks/fixtures')

  return {
    authMiddleware: createMiddleware(async (c, next) => {
      if (authState.userIndex === null) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      c.set('user', MOCK_USERS[authState.userIndex])
      await next()
    }),
  }
})

import { Prisma } from '@/app/generated/prisma/client'
import app from '@/lib/hono/app'

function p2025Error() {
  return new Prisma.PrismaClientKnownRequestError('No record was found for a delete.', {
    code: 'P2025',
    clientVersion: '7.9.0',
  })
}

describe('招待リンク削除API', () => {
  beforeAll(() => {
    vi.stubEnv('MOCK_MODE', 'false')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    authState.userIndex = 0
  })

  it('管理者が招待リンクをハードデリートできる', async () => {
    prismaMock.invite.delete.mockResolvedValue({ id: 'invite-test' })

    const response = await app.request('/api/admin/invites/invite-test', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(prismaMock.invite.delete).toHaveBeenCalledWith({
      where: { id: 'invite-test' },
    })
  })

  it('対象が存在しない場合も成功扱いにする', async () => {
    prismaMock.invite.delete.mockRejectedValue(p2025Error())

    const response = await app.request('/api/admin/invites/missing-invite', { method: 'DELETE' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('一般ユーザーによる削除を拒否する', async () => {
    authState.userIndex = 1

    const response = await app.request('/api/admin/invites/invite-test', { method: 'DELETE' })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(prismaMock.invite.delete).not.toHaveBeenCalled()
  })

  it('未認証ユーザーによる削除を拒否する', async () => {
    authState.userIndex = null

    const response = await app.request('/api/admin/invites/invite-test', { method: 'DELETE' })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(prismaMock.invite.delete).not.toHaveBeenCalled()
  })
})
