import type { Dispatch, SetStateAction } from 'react'
import { FormLabel } from '@/components/design-system/form-label'
import { FormSelect } from '@/components/design-system/form-select'

const CAREER_THRESHOLDS: { max: number; name: string }[] = [
  { max: 1, name: 'チャレンジャー' },
  { max: 3, name: '番長' },
  { max: 8, name: '大黒柱' },
]
const CAREER_FALLBACK_NAME = 'ヌシ'

type FormTitleSelectRowProps = {
  label: string
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
}: FormTitleSelectRowProps) {
  const toIbjCareer = (
    nextYearValue: FormTitleSelectRowProps['yearValue'],
    nextMonthValue: FormTitleSelectRowProps['monthValue'],
  ) => {
    if (!nextYearValue || !nextMonthValue) return

    const today = new Date()
    const year = today.getFullYear() - Number(nextYearValue)
    const month = today.getMonth() + 1 - Number(nextMonthValue)

    // 入社月がまだ来ていなければ、その年の勤続年数は切り捨てる（誕生日未到来の年齢計算と同じ考え方）
    const employmentYears = month >= 0 ? year : year - 1

    toIbjCareerName(employmentYears)
  }

  const toIbjCareerName = (employmentYears: number) => {
    const matched = CAREER_THRESHOLDS.find((threshold) => employmentYears <= threshold.max)
    setIbjCareerName(matched?.name ?? CAREER_FALLBACK_NAME)
  }

  const handleYearChange = (value: string) => {
    onYearChange(value)
    toIbjCareer(value, monthValue)
  }

  const handleMonthChange = (value: string) => {
    onMonthChange(value)
    toIbjCareer(yearValue, value)
  }

  return (
    <div className="flex flex-col gap-2 w-full h-24.5">
      <FormLabel label={label} isRequired={isRequired} isInfoIcon={isInfoIcon} />

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
        <p className="text-caption font-medium text-secondary-foreground">
          あなたは{ibjCareerName}です。
        </p>
      )}
    </div>
  )
}
