import { IconClose } from '@/components/design-system/icons/icon-close'
import {
  NotificationItem,
  type NotificationItemType,
} from '@/components/design-system/ui/notification-item'
import { cn } from '@/lib/utils'

type NotificationPanelEntry = {
  id: string
  type: NotificationItemType
  message: string
  /** 「2時間前」など、相対表記の受信時刻 */
  timestamp: string
  isRead: boolean
  /** 指定すると行全体が関連ページへのリンクになる */
  href?: string
}

type NotificationPanelProps = {
  className?: string
  notifications: NotificationPanelEntry[]
  title?: string
  /** 渡すとヘッダーに閉じるボタンを表示する */
  onClose?: () => void
  /** 通知を開いたとき（既読化など） */
  onNotificationClick?: (id: string) => void
  /** 通知が 0 件のときに中央へ表示する文言 */
  emptyMessage?: string
}

/** 受信トレイ。通知が 0 件のときは空状態を表示する。 */
function NotificationPanel({
  className,
  notifications,
  title = '受信トレイ',
  onClose,
  onNotificationClick,
  emptyMessage = '通知が届いていません',
}: NotificationPanelProps) {
  return (
    <div
      data-slot="notification-panel"
      className={cn('flex h-full w-full flex-col gap-6 rounded-lg bg-background-2 p-6', className)}
    >
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-heading-3 text-foreground">{title}</h2>
        {onClose && (
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <IconClose className="size-4 text-foreground" />
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="flex flex-1 items-center justify-center font-heading text-heading-2 text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="scrollbar-custom flex min-h-0 flex-1 flex-col divide-y divide-border-3 overflow-y-auto">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem
                type={notification.type}
                message={notification.message}
                timestamp={notification.timestamp}
                isRead={notification.isRead}
                href={notification.href}
                onClick={
                  onNotificationClick ? () => onNotificationClick(notification.id) : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export type { NotificationPanelEntry, NotificationPanelProps }
export { NotificationPanel }
