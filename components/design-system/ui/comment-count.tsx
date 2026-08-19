import { cva, type VariantProps } from 'class-variance-authority'
import { MessageCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

const commentCountVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap text-muted-foreground',
  {
    variants: {
      size: {
        default: 'text-paragraph-small',
        large: 'text-paragraph',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

type CommentCountProps = VariantProps<typeof commentCountVariants> & {
  className?: string
  count: number
}

function CommentCount({ className, size = 'default', count }: CommentCountProps) {
  return (
    <span data-slot="comment-count" className={cn(commentCountVariants({ size }), className)}>
      <MessageCircle
        aria-hidden
        className={cn('shrink-0', size === 'large' ? 'size-4.5' : 'size-3.5')}
      />
      {count}
    </span>
  )
}

export { CommentCount }
