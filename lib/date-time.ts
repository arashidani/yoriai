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
