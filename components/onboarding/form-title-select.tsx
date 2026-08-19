import { FormLabel } from '@/components/design-system/form-label'
import { FormSelect } from '@/components/design-system/form-select'

type FormTitleSelectOption = { id: string; name: string }

type FormTitleSelectProps = {
  id: string
  label: string
  isRequired?: boolean
  placeholder?: string
  error?: string
  options: FormTitleSelectOption[]
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
}

export function FormTitleSelect({
  id,
  label,
  isRequired,
  placeholder,
  error,
  options,
  value,
  onValueChange,
  onBlur,
}: FormTitleSelectProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <FormLabel label={label} isRequired={isRequired} id={id} />

      <FormSelect
        id={id}
        placeholder={placeholder}
        error={error}
        options={options}
        value={value}
        onValueChange={onValueChange}
        onBlur={onBlur}
      />
    </div>
  )
}
