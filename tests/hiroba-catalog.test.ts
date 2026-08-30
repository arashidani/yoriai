import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  canJoinHiroba,
  findHiroba,
  HIROBA_CATALOG,
  HIROBA_SECTIONS,
  isDefaultHiroba,
  MBTI_HIROBA_SLUGS,
} from '@/lib/hiroba/catalog'

describe('fixed hiroba catalog', () => {
  it('contains 32 unique fixed hirobas grouped into sections', () => {
    expect(HIROBA_CATALOG).toHaveLength(32)
    expect(new Set(HIROBA_CATALOG.map((hiroba) => hiroba.id)).size).toBe(32)
    expect(new Set(HIROBA_CATALOG.map((hiroba) => hiroba.slug)).size).toBe(32)
    expect(HIROBA_SECTIONS.flatMap((section) => section.items)).toEqual(HIROBA_CATALOG)
  })

  it('resolves only a catalog slug', () => {
    expect(findHiroba('feature-testing')?.name).toBe('機能たしかめ広場')
    expect(findHiroba('alcohol')?.name).toBe('お酒')
    expect(findHiroba('company-events')?.name).toBe('社内イベント')
    expect(findHiroba('mbti-purple')?.name).toBe('むらさきの人')
    expect(findHiroba('legacy-hiroba')).toBeUndefined()
  })

  it('makes the feature-testing hiroba a default membership', () => {
    expect(isDefaultHiroba('feature-testing')).toBe(true)
    expect(isDefaultHiroba('alcohol')).toBe(false)
  })

  it('uses each catalog card tone on its detail page', () => {
    expect(HIROBA_CATALOG.every((hiroba) => !('detailTone' in hiroba))).toBe(true)
    expect(findHiroba('alcohol')?.category).toBe('pickup')
  })

  it('allows MBTI membership only for the selected color', () => {
    expect(canJoinHiroba('mbti-green', 'GREEN')).toBe(true)
    expect(canJoinHiroba('mbti-purple', 'GREEN')).toBe(false)
    expect(canJoinHiroba('alcohol', 'GREEN')).toBe(true)
  })
})

// ひろば詳細ページは DB の Hiroba 行が無いと notFound() になる（lib/hiroba/posts.ts の getHiroba）。
// カタログに追加したのに INSERT するマイグレーションを書き忘れると、カード自体は一覧に出るのに
// リンク先が全て404になるため、カタログとシードの対応をここで固定する。
describe('hiroba catalog is backed by seed migrations', () => {
  const migrationsDir = fileURLToPath(new URL('../prisma/migrations', import.meta.url))

  const seededSlugs = new Set(
    readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const file = join(migrationsDir, entry.name, 'migration.sql')
        if (!existsSync(file)) return []
        const sql = readFileSync(file, 'utf8')
        if (!sql.includes('INSERT INTO "Hiroba"')) return []
        return [...sql.matchAll(/'hiroba-[a-z0-9-]+',\s*'([a-z0-9-]+)'/g)].map((match) => match[1])
      }),
  )

  it('seeds every catalog slug', () => {
    const missing = HIROBA_CATALOG.map((hiroba) => hiroba.slug).filter(
      (slug) => !seededSlugs.has(slug),
    )
    expect(missing).toEqual([])
  })

  it('seeds all four MBTI hirobas', () => {
    for (const slug of MBTI_HIROBA_SLUGS) {
      expect(seededSlugs.has(slug)).toBe(true)
    }
  })
})
