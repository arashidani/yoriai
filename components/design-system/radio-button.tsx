import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type RadioButtonOption = { value: string; label: string }

type RadioButtonProps = {
  name: string
  options: RadioButtonOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function RadioButton({ name, options, value, onValueChange, className }: RadioButtonProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      className={className ?? 'flex flex-col gap-2'}
    >
      {options.map((option) => (
        <label
          key={option.value}
          htmlFor={`${name}-${option.value}`}
          className="flex cursor-pointer items-center gap-2 text-label text-foreground-alt"
        >
          <RadioGroupItem id={`${name}-${option.value}`} value={option.value} />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  )
}
