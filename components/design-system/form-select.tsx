import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type FormSelectOption = { id: string; name: string }

type FormSelectProps = {
  id: string
  placeholder?: string
  error?: string
  options: FormSelectOption[]
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  className?: string
}

export function FormSelect({
  id,
  placeholder = '選択してください',
  error,
  options,
  value,
  onValueChange,
  onBlur,
  className,
}: FormSelectProps) {
  return (
    <Select<string>
      items={options.map((option) => ({ value: option.id, label: option.name }))}
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue ?? '')}
      onOpenChange={(open) => {
        if (!open) onBlur?.()
      }}
    >
      <SelectTrigger
        id={id}
        className={cn('w-full data-[size=default]:h-11', className)}
        aria-invalid={!!error}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
