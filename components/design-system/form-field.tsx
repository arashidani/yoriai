import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  error?: string
  inputProps: ComponentProps<typeof Input>
}

export function FormField({ label, error, inputProps }: FormFieldProps) {
  const { className, ...restInputProps } = inputProps

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-1">
        <Label htmlFor={inputProps.id}>
          <p className="text-sm font-bold text-foreground">{label}</p>
        </Label>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Input {...restInputProps} aria-invalid={!!error} className={cn('p-3 h-11', className)} />
    </div>
  )
}
