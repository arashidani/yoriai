import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getIbjCareerName } from '@/lib/users/ibj-career'

describe('getIbjCareerName', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-23T00:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns an empty string when year or month is missing', () => {
    expect(getIbjCareerName('', '4')).toBe('')
    expect(getIbjCareerName('2024', '')).toBe('')
  })

  it('maps employment years to career names', () => {
    expect(getIbjCareerName('2025', '8')).toBe('チャレンジャー')
    expect(getIbjCareerName('2023', '8')).toBe('番長')
    expect(getIbjCareerName('2020', '4')).toBe('大黒柱')
    expect(getIbjCareerName('2015', '4')).toBe('ヌシ')
  })

  it('does not count the current year until the joined month arrives', () => {
    expect(getIbjCareerName('2022', '10')).toBe('番長')
  })
})
