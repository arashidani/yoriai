import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'w-full  rounded-full disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      size: {
        extraLarge: 'px-8 py-6 font-bold text-paragraph',
      },
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/80',
        disabled: 'bg-muted text-muted-foreground',
      },
    },
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
  isDisabled = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { isDisabled?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={isDisabled}
      className={cn(
        buttonVariants({ size, variant: isDisabled ? 'disabled' : variant, className }),
      )}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
