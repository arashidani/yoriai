import type { DisplayNameColor } from '@/app/generated/prisma/enums'

const classByDisplayNameColor: Record<DisplayNameColor, string> = {
  GREEN: 'text-display-name-green',
  YELLOW: 'text-display-name-yellow',
  BLUE: 'text-display-name-blue',
  PURPLE: 'text-display-name-purple',
  GRAY: 'text-display-name-gray',
}

export function displayNameColorClass(color: DisplayNameColor | null | undefined) {
  return color ? classByDisplayNameColor[color] : 'text-foreground'
}
