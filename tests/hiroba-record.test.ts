import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    hiroba: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/lib/prisma/client', () => ({ prisma: prismaMock }))

import { Prisma } from '@/app/generated/prisma/client'
import { ensureHirobaBySlug } from '@/lib/hiroba/record'

describe('ensureHirobaBySlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('既存の行があればそのまま返す', async () => {
    prismaMock.hiroba.findUnique.mockResolvedValue({ id: 'hiroba-mbti-green', slug: 'mbti-green' })

    await expect(ensureHirobaBySlug('mbti-green')).resolves.toEqual({
      id: 'hiroba-mbti-green',
      slug: 'mbti-green',
    })
    expect(prismaMock.hiroba.create).not.toHaveBeenCalled()
  })

  // マイグレーション未適用でも詳細ページが404にならないようにするための補完。
  it('行が無ければカタログの定義から作る', async () => {
    prismaMock.hiroba.findUnique.mockResolvedValue(null)
    prismaMock.hiroba.create.mockResolvedValue({ id: 'generated-id', slug: 'mbti-green' })

    await expect(ensureHirobaBySlug('mbti-green')).resolves.toEqual({
      id: 'generated-id',
      slug: 'mbti-green',
    })
    expect(prismaMock.hiroba.create).toHaveBeenCalledWith({
      data: {
        slug: 'mbti-green',
        name: 'みどりの人',
        description: 'MBTIが緑グループの人のためのひろばです。',
      },
    })
  })

  it('カタログに無いslugでは行を作らない', async () => {
    await expect(ensureHirobaBySlug('legacy-hiroba')).resolves.toBeNull()
    expect(prismaMock.hiroba.findUnique).not.toHaveBeenCalled()
    expect(prismaMock.hiroba.create).not.toHaveBeenCalled()
  })

  it('同時アクセスで重複した場合は先に作られた行を返す', async () => {
    prismaMock.hiroba.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'winner-id', slug: 'mbti-green' })
    prismaMock.hiroba.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    )

    await expect(ensureHirobaBySlug('mbti-green')).resolves.toEqual({
      id: 'winner-id',
      slug: 'mbti-green',
    })
  })

  it('重複以外のエラーは握りつぶさない', async () => {
    prismaMock.hiroba.findUnique.mockResolvedValue(null)
    prismaMock.hiroba.create.mockRejectedValue(new Error('接続できません'))

    await expect(ensureHirobaBySlug('mbti-green')).rejects.toThrow('接続できません')
  })
})
