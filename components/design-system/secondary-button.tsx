import { cn } from '@/lib/utils'

export function SecondaryButton({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'w-full shrink-0 border-border-3 px-8 py-6 border-2 rounded-full whitespace-nowrap hover:opacity-50 transition-opacity',
        className,
      )}
      {...props}
    >
      戻る
    </button>
  )
}
