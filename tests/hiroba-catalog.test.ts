import { describe, expect, it } from 'vitest'
import {
  canJoinHiroba,
  findHiroba,
  HIROBA_CATALOG,
  HIROBA_SECTIONS,
  isDefaultHiroba,
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
    expect(findHiroba('mbti-purple')?.name).toBe('紫の人の広場')
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
