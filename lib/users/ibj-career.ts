const CAREER_THRESHOLDS: { max: number; name: string }[] = [
  { max: 1, name: 'チャレンジャー' },
  { max: 3, name: '番長' },
  { max: 8, name: '大黒柱' },
]
const CAREER_FALLBACK_NAME = 'ヌシ'

export function getIbjCareerName(yearValue: string, monthValue: string): string {
  if (!yearValue || !monthValue) return ''

  const today = new Date()
  const year = today.getFullYear() - Number(yearValue)
  const month = today.getMonth() + 1 - Number(monthValue)

  // 入社月がまだ来ていなければ、その年の勤続年数は切り捨てる（誕生日未到来の年齢計算と同じ考え方）
  const employmentYears = month >= 0 ? year : year - 1

  const matched = CAREER_THRESHOLDS.find((threshold) => employmentYears <= threshold.max)
  return matched?.name ?? CAREER_FALLBACK_NAME
}
