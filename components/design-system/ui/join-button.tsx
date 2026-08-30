import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { IconCheck } from '../icons/icon-check'
import { IconHuman } from '../icons/icon-human'

type JoinButtonProps = ButtonPrimitive.Props & {
  joined?: boolean
  className?: string
}

const joinButtonVariants = cva(
  'w-[131px] px-6 py-4 inline-flex cursor-pointer items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap outline-none text-statuschip-foreground disabled:pointer-events-none ',
  {
    variants: {
      joined: {
        false:
          'border-2 border-statuschip-foreground transition-colors hover:bg-statuschip hover:text-statuschip-success',
        true: 'bg-statuschip',
      },
    },
    defaultVariants: {
      joined: false,
    },
  },
)

function JoinButton({ joined = false, className, disabled, ...props }: JoinButtonProps) {
  const Icon = joined ? IconCheck : IconHuman

  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled}
      className={cn(joinButtonVariants({ joined }), className)}
      {...props}
    >
      <span className="size-4 shrink-0 overflow-clip">
        <Icon className="size-4 text-statuschip-foreground" aria-hidden />
      </span>
      <p className="font-bold text-md text-statuschip-foreground">
        {joined ? '参加中' : '参加する'}
      </p>
    </ButtonPrimitive>
  )
}

export { JoinButton, joinButtonVariants }
