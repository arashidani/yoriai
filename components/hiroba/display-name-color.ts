import type { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'

const classByDisplayNameColor: Record<DisplayNameColor, string> = {
  GREEN: 'text-display-name-green',
  YELLOW: 'text-display-name-yellow',
  BLUE: 'text-display-name-blue',
  PURPLE: 'text-display-name-purple',
  GRAY: 'text-display-name-gray',
}

const mbtiTagByDisplayNameColor: Partial<
  Record<DisplayNameColor, { label: string; className: string }>
> = {
  GREEN: { label: 'みどり色の人', className: 'bg-mbti-green-bg text-mbti-green' },
  YELLOW: { label: 'きいろ色の人', className: 'bg-mbti-yellow-bg text-mbti-yellow' },
  BLUE: { label: 'あお色の人', className: 'bg-mbti-blue-bg text-mbti-blue' },
  PURPLE: { label: 'むらさき色の人', className: 'bg-mbti-purple-bg text-mbti-purple' },
}

const lunchStyleLabel: Record<LunchPreference, string> = {
  NO_PREFERENCE: 'こだわりない',
  TEAM: 'チームで',
  ALONE: '一人で',
}

export function displayNameColorClass(color: DisplayNameColor | null | undefined) {
  return color ? classByDisplayNameColor[color] : 'text-foreground'
}

export function mbtiColorTag(color: DisplayNameColor | null | undefined) {
  return color ? mbtiTagByDisplayNameColor[color] : undefined
}

export function lunchStyleTag(lunchPreference: LunchPreference | null | undefined) {
  return lunchPreference ? lunchStyleLabel[lunchPreference] : undefined
}
