import type { Dispatch, SetStateAction } from 'react'
import { FormLabel } from '@/components/design-system/form-label'
import { FormSelect } from '@/components/design-system/form-select'
import { cn } from '@/lib/utils'

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

type FormTitleSelectRowProps = {
  label?: string
  isRequired?: boolean
  years: string[]
  months: string[]
  yearValue: string
  monthValue: string
  onYearChange: (value: string) => void
  onMonthChange: (value: string) => void
  onYearBlur?: () => void
  onMonthBlur?: () => void
  yearError?: string
  monthError?: string
  placeholder?: [string, string]
  isInfoIcon?: boolean
  setIbjCareerName: Dispatch<SetStateAction<string>>
  ibjCareerName: string
  wrapperHeightClassName?: string
}

export function FormTitleSelectRow({
  label,
  isRequired,
  years,
  months,
  yearValue,
  monthValue,
  onYearChange,
  onMonthChange,
  onYearBlur,
  onMonthBlur,
  yearError,
  monthError,
  placeholder = ['選択してください', '選択してください'],
  isInfoIcon,
  ibjCareerName,
  setIbjCareerName,
  wrapperHeightClassName = 'h-24.5',
}: FormTitleSelectRowProps) {
  const handleYearChange = (value: string) => {
    onYearChange(value)
    setIbjCareerName(getIbjCareerName(value, monthValue))
  }

  const handleMonthChange = (value: string) => {
    onMonthChange(value)
    setIbjCareerName(getIbjCareerName(yearValue, value))
  }

  return (
    <div className={cn('flex flex-col gap-2 w-full', wrapperHeightClassName)}>
      {label && <FormLabel label={label} isRequired={isRequired} isInfoIcon={isInfoIcon} />}

      <div className="flex items-center gap-2 w-full">
        <div className="flex flex-1 items-center gap-2">
          <FormSelect
            id="joined-year"
            options={years.map((year) => ({ id: year, name: year }))}
            value={yearValue}
            onValueChange={handleYearChange}
            onBlur={onYearBlur}
            error={yearError}
            placeholder={placeholder[0]}
          />
          <span className="text-sm font-bold text-foreground">年</span>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <FormSelect
            id="joined-month"
            options={months.map((month) => ({ id: month, name: month }))}
            value={monthValue}
            onValueChange={handleMonthChange}
            onBlur={onMonthBlur}
            error={monthError}
            placeholder={placeholder[1]}
          />
          <span className="text-sm font-bold text-foreground">月</span>
        </div>
      </div>

      {ibjCareerName !== '' && (
        <p className="text-caption font-medium text-secondary-foreground tracking-normal">
          あなたは{ibjCareerName}です。
        </p>
      )}
    </div>
  )
}
