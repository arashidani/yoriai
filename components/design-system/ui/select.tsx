import type { ComponentProps } from 'react'
import {
  SelectContent,
  SelectItem,
  Select as SelectPrimitive,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type SelectOption = { value: string; label: string }

type SelectProps = Omit<
  ComponentProps<typeof SelectPrimitive>,
  'defaultValue' | 'items' | 'multiple' | 'onValueChange' | 'value'
> & {
  options: SelectOption[]
  placeholder?: string
  className?: string
  id?: string
  'aria-invalid'?: boolean
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

function Select({
  options,
  placeholder = '選択してください',
  className,
  id,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const items = [{ label: placeholder, value: null }, ...options]

  return (
    <SelectPrimitive<string | null> items={items} modal {...props}>
      <SelectTrigger
        id={id}
        aria-invalid={ariaInvalid}
        className={cn(
          'w-full min-h-9 justify-between font-medium text-paragraph-small data-placeholder:font-normal',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null} label={placeholder}>
          {placeholder}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive>
  )
}

export type { SelectOption }
export { Select }
