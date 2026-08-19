import {
  Activity,
  BookOpen,
  Camera,
  Cat,
  CircleDot,
  Clapperboard,
  Coffee,
  CookingPot,
  Dog,
  Dumbbell,
  Gamepad2,
  House,
  Lightbulb,
  Mic2,
  Mountain,
  Music2,
  Palette,
  Plane,
  Play,
  Popcorn,
  Sparkles,
  TentTree,
  Trophy,
  Utensils,
  Waves,
  Wine,
} from 'lucide-react'
import type { ComponentProps } from 'react'

const icons = {
  activity: Activity,
  ball: Trophy,
  book: BookOpen,
  camera: Camera,
  cat: Cat,
  'circle-dot': CircleDot,
  clapperboard: Clapperboard,
  coffee: Coffee,
  'cooking-pot': CookingPot,
  dog: Dog,
  dumbbell: Dumbbell,
  gamepad: Gamepad2,
  house: House,
  lightbulb: Lightbulb,
  mic: Mic2,
  mountain: Mountain,
  music: Music2,
  palette: Palette,
  plane: Plane,
  play: Play,
  popcorn: Popcorn,
  sparkles: Sparkles,
  tent: TentTree,
  utensils: Utensils,
  waves: Waves,
  wine: Wine,
} as const

type HirobaIconProps = ComponentProps<'svg'> & { name: string }

export function HirobaIcon({ name, ...props }: HirobaIconProps) {
  const Icon = icons[name as keyof typeof icons] ?? Sparkles
  return <Icon {...props} />
}
