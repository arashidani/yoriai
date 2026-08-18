import { describe, expect, it } from 'vitest'
import { findHiroba, HIROBA_CATALOG, HIROBA_SECTIONS } from '@/lib/hiroba/catalog'

describe('fixed hiroba catalog', () => {
  it('contains 26 unique fixed hirobas grouped into sections', () => {
    expect(HIROBA_CATALOG).toHaveLength(26)
    expect(new Set(HIROBA_CATALOG.map((hiroba) => hiroba.id)).size).toBe(26)
    expect(new Set(HIROBA_CATALOG.map((hiroba) => hiroba.slug)).size).toBe(26)
    expect(HIROBA_SECTIONS.flatMap((section) => section.items)).toEqual(HIROBA_CATALOG)
  })

  it('resolves only a catalog slug', () => {
    expect(findHiroba('alcohol')?.name).toBe('お酒')
    expect(findHiroba('legacy-hiroba')).toBeUndefined()
  })

  it('uses each catalog card tone on its detail page', () => {
    expect(HIROBA_CATALOG.every((hiroba) => !('detailTone' in hiroba))).toBe(true)
    expect(findHiroba('alcohol')?.tone).toBe('lime')
  })
})
