import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/design-system/button'
import { IconPencil } from '@/components/design-system/icons/icon-pencil'
import { Textarea } from '@/components/design-system/ui/textarea'
import { cn } from '@/lib/utils'

type AnswerFormProps = {
  className?: string
  placeholder?: string
  submitLabel?: string
  disabled?: boolean
  textareaProps?: Omit<ComponentProps<typeof Textarea>, 'placeholder' | 'disabled' | 'className'>
  textarea?: ReactNode
} & Omit<ComponentProps<'form'>, 'className'>

function AnswerForm({
  className,
  placeholder = '回答を入力する',
  submitLabel = '回答',
  disabled = false,
  textareaProps,
  textarea,
  ...formProps
}: AnswerFormProps) {
  return (
    <form data-slot="answer-form" className={cn('relative w-full', className)} {...formProps}>
      {textarea ?? (
        <Textarea placeholder={placeholder} disabled={disabled} rows={4} {...textareaProps} />
      )}
      <Button
        type="submit"
        size="default"
        variant="primary"
        leftIcon={<IconPencil className="size-full" />}
        isDisabled={disabled}
        className="absolute right-4 bottom-3.5"
      >
        {submitLabel}
      </Button>
    </form>
  )
}

export type { AnswerFormProps }
export { AnswerForm }
