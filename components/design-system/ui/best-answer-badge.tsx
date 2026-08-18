import Image from 'next/image'

import { cn } from '@/lib/utils'

type BestAnswerBadgeProps = {
  className?: string
}

function BestAnswerBadge({ className }: BestAnswerBadgeProps) {
  return (
    <Image
      src="/badges/best-answer-badge.svg"
      alt="ベストアンサー"
      width={61}
      height={79}
      className={cn('h-auto w-[61px]', className)}
    />
  )
}

export type { BestAnswerBadgeProps }
export { BestAnswerBadge }
