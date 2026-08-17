import type { ComponentProps } from 'react'
import { FormLabel } from '@/components/design-system/form-label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  error?: string
  inputProps: ComponentProps<typeof Input>
  isRequired?: boolean
  caption?: string
  maxLength?: number
}

export function FormField({
  label,
  error,
  inputProps,
  isRequired = false,
  caption,
  maxLength,
}: FormFieldProps) {
  const { className, ...restInputProps } = inputProps

  return (
    <div className="flex flex-col gap-2 w-full">
      <FormLabel label={label} isRequired={isRequired} id={inputProps.id} />

      <Input
        {...restInputProps}
        aria-invalid={!!error}
        className={cn('p-3 h-11', className)}
        maxLength={maxLength}
      />

      {caption && <p className="text-caption text-secondary-foreground">{caption}</p>}
    </div>
  )
}
