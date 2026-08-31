import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'w-full min-h-19 border-2 border-input bg-card p-3 text-paragraph-small font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border focus-visible:border-border-4 focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border aria-invalid:border-destructive-border aria-invalid:ring-3 aria-invalid:ring-ring-error disabled:cursor-not-allowed disabled:border disabled:border-border disabled:opacity-30',
  {
    variants: {
      roundness: {
        default: 'rounded-lg',
        round: 'rounded-[18px]',
      },
    },
    defaultVariants: {
      roundness: 'default',
    },
  },
)

type TextareaProps = ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>

function Textarea({ className, roundness, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ roundness }), className)}
      {...props}
    />
  )
}

const textareaWithActionsVariants = cva(
  'flex w-full flex-col overflow-hidden border-2 border-border-3 bg-card transition-colors focus-within:border-border-4 has-aria-invalid:border-destructive-border',
  {
    variants: {
      roundness: {
        default: 'rounded-lg',
        round: 'rounded-[18px]',
      },
    },
    defaultVariants: {
      roundness: 'default',
    },
  },
)

type TextareaWithActionsProps = ComponentProps<'textarea'> &
  VariantProps<typeof textareaWithActionsVariants> & {
    /** 下段左側のアクション（画像添付など） */
    leadingActions?: ReactNode
    /** 下段右側のアクション（送信など） */
    actions?: ReactNode
    /** 入力欄とアクションバーの間に差し込む要素（画像プレビュー・オーバーレイなど） */
    children?: ReactNode
    /** 外枠に当てる className。className は textarea 本体に当たる */
    containerClassName?: string
  }

/**
 * Figma の Textarea（2段構成）。
 * 上段が入力欄、下段が左右に分かれたアクションバー。枠線は外枠が一括で持ち、
 * 入力欄自体は枠線なしで上段に収まる。
 * 入力量に応じて高さが伸びる（上限なし）。
 */
function TextareaWithActions({
  className,
  containerClassName,
  roundness,
  leadingActions,
  actions,
  children,
  ...props
}: TextareaWithActionsProps) {
  return (
    <div
      data-slot="textarea-with-actions"
      className={cn(textareaWithActionsVariants({ roundness }), containerClassName)}
    >
      <textarea
        data-slot="textarea"
        className={cn(
          'field-sizing-content w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-paragraph-small font-medium text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />

      {children}

      <div
        data-slot="textarea-actions"
        className="flex items-end justify-between gap-2 px-4 pt-2 pb-4"
      >
        <div className="flex items-center gap-2">{leadingActions}</div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  )
}

export type { TextareaProps, TextareaWithActionsProps }
export { Textarea, TextareaWithActions }
