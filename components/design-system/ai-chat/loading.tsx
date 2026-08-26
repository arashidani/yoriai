import { cn } from '@/lib/utils'

type LoadingProps = {
  className?: string
  children?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Loading({
  className,
  children = 'よりあいぬが考え中',
  leftIcon,
  rightIcon,
}: LoadingProps) {
  return (
    <div
      data-slot="loading"
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-10 w-fit max-w-full items-center justify-center gap-2 rounded-full bg-card px-6 py-4 text-muted-foreground',
        className,
      )}
    >
      {leftIcon && <span className="size-4 shrink-0 overflow-clip">{leftIcon}</span>}
      <p className="min-w-0 break-words text-center font-bold text-paragraph-small">{children}</p>
      {rightIcon && <span className="size-4 shrink-0 overflow-clip">{rightIcon}</span>}
    </div>
  )
}

export { Loading }
