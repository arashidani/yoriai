import { cva } from 'class-variance-authority'
import type { HirobaCategory } from '@/lib/hiroba/catalog'
import { cn } from '@/lib/utils'
import { type SquareIconName, SquareIcons } from './square-icons'

type SquareIconProps = {
  hirobaIcon: SquareIconName
  category?: HirobaCategory
  size?: 'small' | 'large'
  className?: string
}

/** Figma実寸（alcohol: 19x18 → 43x42）に合わせた、円形背景付きLargeサイズ用の拡大率 */
const LARGE_ICON_SCALE = 2.3

const squareIconWrapperVariants = cva(
  'flex items-center justify-center  bg-background-2 rounded-full ',
  {
    variants: {
      category: {
        pickup: 'bg-hiroba-pickup-border',
        active: 'bg-hiroba-active-border',
        indoor: 'bg-hiroba-indoor-border',
        maniac: 'bg-hiroba-maniac-border',
        food: 'bg-hiroba-food-border',
        knowhow: 'bg-hiroba-knowhow-border',
        mbtiGreen: 'bg-hiroba-mbti-green-border',
        mbtiBlue: 'bg-hiroba-mbti-blue-border',
        mbtiYellow: 'bg-hiroba-mbti-yellow-border',
        mbtiPurple: 'bg-hiroba-mbti-purple-border',
      },
      size: {
        large: 'w-22.75 h-22.5 p-6 border-3',
        small: 'w-9.5 h-9.5 p-2 border-[1px]',
      },
    },
    defaultVariants: {
      category: 'pickup',
    },
  },
)

export function SquareIcon({
  hirobaIcon,
  category = 'pickup',
  size = 'large',
  className,
}: SquareIconProps) {
  return (
    <div className={cn(squareIconWrapperVariants({ category, size }), className)}>
      <SquareIcons name={hirobaIcon} scale={size === 'large' ? LARGE_ICON_SCALE : undefined} />
    </div>
  )
}
