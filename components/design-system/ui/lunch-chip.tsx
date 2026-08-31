import Image from 'next/image'
import lunchIcon from '@/assets/lunch.svg'

const LUNCH_TYPE = {
  any: 'こだわらない',
  team: 'チームで',
  solo: 'ひとりで',
}

export type LunchChipType = keyof typeof LUNCH_TYPE

type LunchChipProps = {
  lunchType: LunchChipType
}

export function LunchChip({ lunchType }: LunchChipProps) {
  return (
    <div className="flex gap-1 items-center bg-lunchchip px-2 py-0.5 rounded-sm">
      <Image
        src={lunchIcon}
        width={17}
        height={20}
        alt=""
        className="h-[10px] w-auto shrink-0"
        style={{ width: 'auto' }}
      />
      <span className="text-caption-bold text-lunchchip-foreground tracking-normal">
        {LUNCH_TYPE[lunchType]}
      </span>
    </div>
  )
}
