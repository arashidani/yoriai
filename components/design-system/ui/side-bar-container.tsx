import Image from 'next/image'

import mascotHyokkoriImage from '@/assets/mascots/mascot_hyokkori.svg'
import { SideHeader } from '@/components/design-system/ui/side-header'
import {
  SideQuestionItem,
  type SideQuestionItemProps,
} from '@/components/design-system/ui/side-question-item'
import { ToolChip } from '@/components/design-system/ui/tool-chip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type SideQuestionData = Omit<SideQuestionItemProps, 'className'> & { id: string }

type SideBarContainerProps = {
  className?: string
  title: string
  message: string
  items: SideQuestionData[]
  emptyMessage?: string
}

function SideBarContainer({
  className,
  title,
  message,
  items,
  emptyMessage,
}: SideBarContainerProps) {
  return (
    <div
      data-slot="side-bar-container"
      className={cn('relative w-full overflow-hidden rounded-lg bg-background-2', className)}
    >
      {/* pb でマスコットとツールチップが重なる余白を確保する */}
      <div className="flex flex-col gap-3 p-6 pb-[70px]">
        <SideHeader title={title} />
        <div className="flex w-full flex-col divide-y divide-border border-y border-border">
          {items.length === 0 && emptyMessage ? (
            <p className="py-4 text-paragraph-small text-secondary-foreground">{emptyMessage}</p>
          ) : (
            items.map(({ id, ...item }) => <SideQuestionItem key={id} {...item} />)
          )}
        </div>
      </div>
      <ToolChip className="absolute right-[59px] bottom-[19px]" side="right" text={message} />
      <Image
        src={mascotHyokkoriImage}
        alt=""
        className="pointer-events-none absolute right-0 bottom-0 h-[78px] w-[53px]"
      />
    </div>
  )
}

function SideBarContainerFallback({ className }: { className?: string }) {
  return (
    <div
      data-slot="side-bar-container"
      className={cn('relative w-full overflow-hidden rounded-lg bg-background-2', className)}
      role="status"
      aria-label="読み込み中"
    >
      <div className="flex flex-col gap-3 p-6 pb-[70px]">
        <Skeleton className="h-6 w-48" />
        <div className="flex w-full flex-col divide-y divide-border border-y border-border">
          {['sidebar-1', 'sidebar-2', 'sidebar-3'].map((key) => (
            <div key={key} className="flex items-start gap-2 p-4" aria-hidden>
              <Skeleton className="size-9.5 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export type { SideBarContainerProps, SideQuestionData }
export { SideBarContainer, SideBarContainerFallback }
