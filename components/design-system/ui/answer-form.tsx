import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/design-system/button'
import { IconPencil } from '@/components/design-system/icons/icon-pencil'
import { Textarea } from '@/components/design-system/ui/textarea'
import { cn } from '@/lib/utils'

/**
 * 入力欄に当てるクラス。リサイズを禁止し、絶対配置の送信ボタン
 * （bottom-3.5 + 高さ 40px）と入力文字が重ならないよう下余白を確保する。
 * textarea スロットを差し替える場合も同じクラスを当てること。
 */
const answerFormTextareaClassName = 'resize-none pb-14'

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
        <Textarea
          id="answer-body"
          name="body"
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={answerFormTextareaClassName}
          {...textareaProps}
        />
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
export { AnswerForm, answerFormTextareaClassName }
