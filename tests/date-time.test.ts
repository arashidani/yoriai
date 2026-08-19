import { describe, expect, it } from 'vitest'
import {
  formatDateJst,
  formatDateTimeJst,
  formatRelativeTime,
  getJstDateRange,
} from '@/lib/date-time'

describe('JST日時ユーティリティ', () => {
  it('UTC日時をJSTの日時へ変換する', () => {
    expect(formatDateTimeJst('2026-08-08T00:00:00.000Z')).toBe('2026/8/8 9:00:00')
  })

  it('UTCとJSTで日付が変わる場合もJSTの日付を返す', () => {
    expect(formatDateJst('2026-08-08T18:00:00.000Z')).toBe('2026/8/9')
  })

  it('JST基準の日付検索範囲を返す', () => {
    expect(getJstDateRange('2026-08-09')).toEqual({
      start: Date.parse('2026-08-09T00:00:00.000+09:00'),
      end: Date.parse('2026-08-09T23:59:59.999+09:00'),
    })
  })

  it('相対時刻を返す', () => {
    const now = Date.now()
    expect(formatRelativeTime(now - 5 * 60_000)).toBe('5分前')
    expect(formatRelativeTime(now - 3 * 60 * 60_000)).toBe('3時間前')
  })
})
