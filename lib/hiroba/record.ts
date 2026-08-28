import type { Hiroba } from '@/app/generated/prisma/client'
import { Prisma } from '@/app/generated/prisma/client'
import { findHiroba } from '@/lib/hiroba/catalog'
import { prisma } from '@/lib/prisma/client'

/**
 * カタログに載っているひろばの DB 行を返す。行が無ければカタログの定義から作る。
 *
 * ひろばのマスタ行はデータマイグレーションの INSERT だけで投入されるため、
 * マイグレーションが未適用の環境では「一覧にカードは並ぶのに詳細ページが404」になる。
 * カタログ(lib/hiroba/catalog.ts)を正としてここで補い、投入漏れが404として表に出ないようにする。
 *
 * カタログに無い slug は null を返すので、任意の slug で行が増えることはない。
 */
export async function ensureHirobaBySlug(slug: string): Promise<Hiroba | null> {
  const catalogHiroba = findHiroba(slug)
  if (!catalogHiroba) return null

  const existing = await prisma.hiroba.findUnique({ where: { slug } })
  if (existing) return existing

  try {
    return await prisma.hiroba.create({
      data: {
        slug: catalogHiroba.slug,
        name: catalogHiroba.name,
        description: catalogHiroba.description,
      },
    })
  } catch (error) {
    // 同時アクセスで他のリクエストが先に作った場合は、そのレコードを使う
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return await prisma.hiroba.findUnique({ where: { slug } })
    }
    throw error
  }
}
