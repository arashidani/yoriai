import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'min-h-9 px-4 py-2 text-paragraph',
        large: 'min-h-10 w-fit px-6 py-4 text-paragraph',
        extraLarge: 'w-full px-8 py-6 text-paragraph',
      },
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring',
        secondary:
          'border-2 border-input bg-secondary text-secondary-foreground hover:border-transparent hover:bg-secondary-hover focus-visible:border-transparent focus-visible:bg-secondary-hover focus-visible:ring-3 focus-visible:ring-ring disabled:border-transparent',
        ghost:
          'bg-transparent text-neutral-800 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring',
      },
    },
    compoundVariants: [
      {
        variant: 'ghost',
        size: 'default',
        class: 'text-xs leading-5 hover:text-foreground',
      },
    ],
    defaultVariants: {
      size: 'extraLarge',
      variant: 'primary',
    },
  },
)

function Button({
  className,
  variant = 'primary',
  size = 'extraLarge',
  children,
  leftIcon,
  rightIcon,
  isDisabled = false,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    isDisabled?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={isDisabled}
      className={cn(buttonVariants({ size, variant, className }))}
      {...props}
    >
      {leftIcon && <span className="size-4 shrink-0 overflow-clip">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="size-4 shrink-0 overflow-clip">{rightIcon}</span>}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
