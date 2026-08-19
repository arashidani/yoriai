import { FormLabel } from '@/components/design-system/form-label'
import { RadioButton } from '@/components/design-system/radio-button'

type FormTitleRadioButtonOption = { value: string; label: string }

type FormTitleRadioButtonProps = {
  name: string
  label: string
  isRequired?: boolean
  options: FormTitleRadioButtonOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function FormTitleRadioButton({
  name,
  label,
  isRequired,
  options,
  value,
  onValueChange,
  className,
}: FormTitleRadioButtonProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <FormLabel label={label} isRequired={isRequired} />

      <RadioButton
        name={name}
        options={options}
        value={value}
        onValueChange={onValueChange}
        className={className}
      />
    </div>
  )
}
