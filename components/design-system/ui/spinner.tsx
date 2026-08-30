import { cva, type VariantProps } from 'class-variance-authority'
import { Spinner as SpinnerPrimitive } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const spinnerIconVariants = cva('shrink-0 text-primary', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
})

type SpinnerLayout = 'inline' | 'center' | 'overlay'

type SpinnerProps = VariantProps<typeof spinnerIconVariants> & {
  className?: string
  /** スクリーンリーダー向け。省略時は「読み込み中」 */
  label?: string
  /**
   * inline: アイコンのみ（親が配置する）
   * center: 親いっぱいに広げて中央配置
   * overlay: 親（relative）を覆う半透明オーバーレイの中央
   */
  layout?: SpinnerLayout
}

function Spinner({
  className,
  label = '読み込み中',
  size = 'lg',
  layout = 'inline',
}: SpinnerProps) {
  const icon = (
    <SpinnerPrimitive
      className={cn(spinnerIconVariants({ size }), layout === 'inline' && className)}
      aria-label={label}
    />
  )

  if (layout === 'overlay') {
    return (
      <div
        className={cn(
          'absolute inset-0 z-40 flex items-center justify-center bg-background/70',
          className,
        )}
      >
        {icon}
      </div>
    )
  }

  if (layout === 'center') {
    return (
      <div className={cn('flex w-full flex-1 items-center justify-center', className)}>{icon}</div>
    )
  }

  return icon
}

export type { SpinnerProps }
export { Spinner }
