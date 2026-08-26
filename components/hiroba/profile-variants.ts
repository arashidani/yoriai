import type { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import type { LunchChipType } from '@/components/design-system/ui/lunch-chip'
import type { MbtiChipVariant } from '@/components/design-system/ui/mbti-chip'

const mbtiVariantByDisplayNameColor: Record<DisplayNameColor, MbtiChipVariant | null> = {
  GREEN: 'green',
  YELLOW: 'yellow',
  BLUE: 'blue',
  PURPLE: 'purple',
  GRAY: null,
}

export function mbtiChipVariant(
  color: DisplayNameColor | null | undefined,
): MbtiChipVariant | undefined {
  return color ? (mbtiVariantByDisplayNameColor[color] ?? undefined) : undefined
}

const lunchChipTypeByPreference: Record<LunchPreference, LunchChipType> = {
  NO_PREFERENCE: 'any',
  TEAM: 'team',
  ALONE: 'solo',
}

export function lunchChipType(
  preference: LunchPreference | null | undefined,
): LunchChipType | undefined {
  return preference ? lunchChipTypeByPreference[preference] : undefined
}
