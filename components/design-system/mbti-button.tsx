import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@/lib/utils'

type MbtiColor = 'green' | 'yellow' | 'blue' | 'purple'

type MbtiButtonProps = {
  text: string
  color: MbtiColor
  isSelected?: boolean
  onClick?: () => void
}

const colorClassNames: Record<MbtiColor, { border: string; text: string; bg: string }> = {
  green: {
    border: 'border-mbti-green',
    text: 'text-mbti-green',
    bg: 'bg-mbti-green-bg',
  },
  yellow: {
    border: 'border-mbti-yellow',
    text: 'text-mbti-yellow',
    bg: 'bg-mbti-yellow-bg',
  },
  blue: {
    border: 'border-mbti-blue',
    text: 'text-mbti-blue',
    bg: 'bg-mbti-blue-bg',
  },
  purple: {
    border: 'border-mbti-purple',
    text: 'text-mbti-purple',
    bg: 'bg-mbti-purple-bg',
  },
}

export function MbtiButton({ text, color, isSelected = false, onClick }: MbtiButtonProps) {
  const colorClassName = colorClassNames[color]

  return (
    <ButtonPrimitive
      type="button"
      data-slot="button"
      onClick={onClick}
      className={cn(
        'flex h-9 w-[89px] items-center justify-center rounded-full px-4 py-2 hover:opacity-50 transition-opacity',
        colorClassName.text,
        isSelected
          ? cn(colorClassName.bg, 'border-transparent')
          : cn('bg-secondary border', colorClassName.border),
      )}
    >
      <p className="text-label font-bold whitespace-nowrap">{text}</p>
    </ButtonPrimitive>
  )
}
