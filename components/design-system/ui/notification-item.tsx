import Link from 'next/link'

import { IconBubbleOutline } from '@/components/design-system/icons/icon-bubble-outline'
import { IconCircle } from '@/components/design-system/icons/icon-circle'
import { IconHuman } from '@/components/design-system/icons/icon-human'
import { IconPawOutline } from '@/components/design-system/icons/icon-paw-outline'
import { cn } from '@/lib/utils'

/** qa: なんでもQ&A の通知 / square: ひろばの通知 / like: いいねの通知 */
type NotificationItemType = 'qa' | 'square' | 'like'

type NotificationItemProps = {
  className?: string
  /** 指定すると行全体が関連ページへのリンクになる */
  href?: string
  /** href なしで指定した場合は行全体がボタンになる（既読化など） */
  onClick?: () => void
  type: NotificationItemType
  /** 通知の本文 */
  message: string
  /** 「2時間前」など、相対表記の受信時刻 */
  timestamp: string
  /** 未読のときだけ右端にドットを表示する */
  isRead?: boolean
}

function NotificationItem({
  className,
  href,
  onClick,
  type,
  message,
  timestamp,
  isRead = false,
}: NotificationItemProps) {
  const content = (
    <>
      <span className="flex shrink-0 items-center justify-center pt-1">
        {type === 'like' ? (
          <IconPawOutline className="h-[14px] w-[17px] text-secondary-foreground" />
        ) : type === 'qa' ? (
          <IconBubbleOutline className="size-[15px] text-secondary-foreground" />
        ) : (
          <IconHuman className="h-[16.667px] w-[15px] text-secondary-foreground" />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="break-words text-body-small text-secondary-foreground">{message}</span>
        <span className="whitespace-nowrap text-caption tracking-normal text-muted-foreground">
          {timestamp}
        </span>
      </span>

      {/* 既読でも枠は残して、未読ドットの有無で行がずれないようにする */}
      <span className="flex size-2.5 shrink-0 items-center">
        {!isRead && (
          <>
            <IconCircle className="size-2.5 text-primary" />
            <span className="sr-only">未読</span>
          </>
        )}
      </span>
    </>
  )

  const rowClassName = cn(
    'flex w-full items-start gap-2 p-4 text-left transition-colors hover:bg-ghost-hover active:bg-ghost-hover',
    (href || onClick) && 'cursor-pointer',
    className,
  )

  if (href) {
    return (
      <Link data-slot="notification-item" href={href} onClick={onClick} className={rowClassName}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        data-slot="notification-item"
        onClick={onClick}
        className={rowClassName}
      >
        {content}
      </button>
    )
  }

  return (
    <div data-slot="notification-item" className={rowClassName}>
      {content}
    </div>
  )
}

export type { NotificationItemProps, NotificationItemType }
export { NotificationItem }
