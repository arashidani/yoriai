import Image from 'next/image'
import twoD from '@/assets/2d.svg'
import alcohol from '@/assets/alcohol.svg'
import art from '@/assets/art.svg'
import baseball from '@/assets/baseball.svg'
import beauty from '@/assets/beauty.svg'
import cafe from '@/assets/cafe.svg'
import camera from '@/assets/camera.svg'
import camp from '@/assets/camp.svg'
import cat from '@/assets/cat.svg'
import comic from '@/assets/comic.svg'
import cook from '@/assets/cook.svg'
import dog from '@/assets/dog.svg'
import drama from '@/assets/drama.svg'
import dumbbell from '@/assets/dumbbell.svg'
import event from '@/assets/event.svg'
import fire from '@/assets/fire.svg'
import food from '@/assets/food.svg'
import game from '@/assets/game.svg'
import hotSpring from '@/assets/hot-spring.svg'
import house from '@/assets/house.svg'
import idol from '@/assets/idol.svg'
import knowhow from '@/assets/knowhow.svg'
import mbtiBlue from '@/assets/mbti-blue.svg'
import mbtiGreen from '@/assets/mbti-green.svg'
import mbtiPurple from '@/assets/mbti-purple.svg'
import mbtiYellow from '@/assets/mbti-yellow.svg'
import mountain from '@/assets/mountain.svg'
import music from '@/assets/music.svg'
import popcorn from '@/assets/popcorn.svg'
import soccer from '@/assets/soccer.svg'
import travel from '@/assets/travel.svg'
import tutorial from '@/assets/tutorial.svg'
import yoga from '@/assets/yoga.svg'
import { cn } from '@/lib/utils'

const SQUARE_ICONS = {
  alcohol,
  dumbbell,
  event,
  dog,
  cat,
  beauty,
  hotSpring,
  mountain,
  house,
  yoga,
  baseball,
  soccer,
  camp,
  travel,
  fire,
  comic,
  camera,
  music,
  drama,
  cook,
  art,
  popcorn,
  game,
  cafe,
  food,
  knowhow,
  idol,
  twoD,
  tutorial,
  mbtiBlue,
  mbtiGreen,
  mbtiPurple,
  mbtiYellow,
} as const

export type SquareIconName = keyof typeof SQUARE_ICONS | 'humanHead'

const MINI_SCALE = 0.78

type SquareIconsProps = {
  name: SquareIconName
  size?: 'large' | 'default' | 'mini'
  /** size による既定の拡大率とは別に、任意の倍率を直接指定する（size より優先） */
  scale?: number
  className?: string
}

export function SquareIcons({
  name,
  size = 'default',
  scale: scaleProp,
  className,
}: SquareIconsProps) {
  if (name === 'humanHead') {
    return (
      <span
        role="img"
        aria-label="人"
        className={cn(
          'block leading-none',
          scaleProp
            ? 'text-heading-1'
            : size === 'mini'
              ? 'text-paragraph-small'
              : 'text-heading-4',
          className,
        )}
      >
        👤
      </span>
    )
  }

  const src = SQUARE_ICONS[name]
  const scale = scaleProp ?? (size === 'mini' ? MINI_SCALE : 1)

  return (
    <Image
      src={src}
      width={src.width * scale}
      height={src.height * scale}
      alt=""
      className={cn('block h-auto', className)}
    />
  )
}
