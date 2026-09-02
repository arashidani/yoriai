export type DateInput = Date | string | number

const JST_TIME_ZONE = 'Asia/Tokyo'

export function formatDateTimeJst(value: DateInput) {
  return new Date(value).toLocaleString('ja-JP', { timeZone: JST_TIME_ZONE })
}

export function formatDateJst(value: DateInput) {
  return new Date(value).toLocaleDateString('ja-JP', { timeZone: JST_TIME_ZONE })
}

export function getJstDateRange(value: string) {
  return {
    start: Date.parse(`${value}T00:00:00.000+09:00`),
    end: Date.parse(`${value}T23:59:59.999+09:00`),
  }
}

export function formatRelativeTime(value: DateInput, now: number = Date.now()) {
  const date = new Date(value)
  const diffMinutes = Math.floor((now - date.getTime()) / 60_000)
  if (diffMinutes < 1) return 'たった今'
  if (diffMinutes < 60) return `${diffMinutes}分前`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}時間前`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}日前`
  return formatDateJst(date)
}
