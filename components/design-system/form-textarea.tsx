import type { ComponentProps } from 'react'
import { FormLabel } from '@/components/design-system/form-label'
import { cn } from '@/lib/utils'
import { Textarea } from '../ui/textarea'

type FormTextAreaProps = {
  label: string
  error?: string
  isRequired?: boolean
  caption?: string
  maxLength?: number
  textareaProps: ComponentProps<typeof Textarea>
}

export function FormTextarea({
  label,
  error,
  isRequired = false,
  caption,
  maxLength,
  textareaProps,
}: FormTextAreaProps) {
  const { className, ...restTextareaProps } = textareaProps

  return (
    <div className="flex flex-col gap-2 w-full">
      <FormLabel label={label} isRequired={isRequired} id={textareaProps.id} />

      <Textarea
        {...restTextareaProps}
        aria-invalid={!!error}
        className={cn('p-3 resize-none', className)}
        maxLength={maxLength}
      />

      {caption && (
        <p className="text-caption text-secondary-foreground tracking-normal font-medium">
          {caption}
        </p>
      )}
    </div>
  )
}
