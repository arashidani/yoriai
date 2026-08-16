'use client'

import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { FilterChip } from '@/components/design-system/ui/filter-chip'

type StatusFilter = {
  id: string
  label: string
}

type QaFeedStatusFilterProps = {
  filters: StatusFilter[]
  value: string
  onValueChange: (value: string) => void
}

function QaFeedStatusFilter({ filters, value, onValueChange }: QaFeedStatusFilterProps) {
  return (
    <ToggleGroupPrimitive
      value={[value]}
      onValueChange={(nextValue) => {
        const selectedValue = nextValue.at(-1)
        if (typeof selectedValue === 'string') onValueChange(selectedValue)
      }}
      orientation="horizontal"
      aria-label="ステータスで絞り込み"
      className="flex flex-wrap items-center gap-2"
    >
      {filters.map(({ id, label }) => (
        <FilterChip key={id} value={id}>
          {label}
        </FilterChip>
      ))}
    </ToggleGroupPrimitive>
  )
}

export { QaFeedStatusFilter }
