import { cn } from '@/lib/utils'
import { FormLabel } from '../design-system/form-label'
import { MultiSelectButton } from '../design-system/multi-select-button'

type MultiSelectButtonOption = { id: string; name: string }

type FormTitleMultiSelectProps = {
  options: MultiSelectButtonOption[]
  label?: string
  isRequired?: boolean
  selectedIds: string[]
  onToggle: (id: string) => void
  className?: string
}

export function FormTitleMultiSelect({
  options,
  label,
  isRequired,
  selectedIds,
  onToggle,
  className,
}: FormTitleMultiSelectProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <FormLabel label={label} isRequired={isRequired} />}

      <div className={cn('flex gap-3 flex-wrap')}>
        {options.map((item) => (
          <MultiSelectButton
            text={item.name}
            key={item.id}
            isSelected={selectedIds.includes(item.id)}
            onClick={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
