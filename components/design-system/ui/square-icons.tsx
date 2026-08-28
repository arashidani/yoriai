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
  alcohol: { src: alcohol, width: 19, height: 18 },
  dumbbell: { src: dumbbell, width: 18, height: 9 },
  event: { src: event, width: 18, height: 18 },
  dog: { src: dog, width: 20, height: 18 },
  cat: { src: cat, width: 19, height: 18 },
  beauty: { src: beauty, width: 20, height: 16 },
  hotSpring: { src: hotSpring, width: 18, height: 15 },
  mountain: { src: mountain, width: 21, height: 15 },
  house: { src: house, width: 18, height: 18 },
  yoga: { src: yoga, width: 22, height: 18 },
  baseball: { src: baseball, width: 18, height: 18 },
  soccer: { src: soccer, width: 18, height: 18 },
  camp: { src: camp, width: 21, height: 18 },
  travel: { src: travel, width: 18, height: 18 },
  fire: { src: fire, width: 14, height: 18 },
  comic: { src: comic, width: 22, height: 18 },
  camera: { src: camera, width: 21, height: 18 },
  music: { src: music, width: 16, height: 18 },
  drama: { src: drama, width: 20, height: 18 },
  cook: { src: cook, width: 17, height: 18 },
  art: { src: art, width: 18, height: 18 },
  popcorn: { src: popcorn, width: 16, height: 18 },
  game: { src: game, width: 21, height: 18 },
  cafe: { src: cafe, width: 20, height: 18 },
  food: { src: food, width: 15, height: 18 },
  knowhow: { src: knowhow, width: 13, height: 18 },
  idol: { src: idol, width: 18, height: 18 },
  twoD: { src: twoD, width: 17, height: 18 },
  tutorial: { src: tutorial, width: 18, height: 18 },
  mbtiBlue: { src: mbtiBlue, width: 16, height: 18 },
  mbtiGreen: { src: mbtiGreen, width: 16, height: 18 },
  mbtiPurple: { src: mbtiPurple, width: 16, height: 18 },
  mbtiYellow: { src: mbtiYellow, width: 16, height: 18 },
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

  const { src, width, height } = SQUARE_ICONS[name]
  const scale = scaleProp ?? (size === 'mini' ? MINI_SCALE : 1)

  return (
    <Image
      src={src}
      width={width * scale}
      height={height * scale}
      alt=""
      className={cn('block', className)}
    />
  )
}
