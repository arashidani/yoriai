'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/design-system/button'
import { IconCheck } from '@/components/design-system/icons/icon-check'
import { IconClose } from '@/components/design-system/icons/icon-close'
import {
  NotificationItem,
  type NotificationItemType,
} from '@/components/design-system/ui/notification-item'
import { Spinner } from '@/components/design-system/ui/spinner'
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
  /** 渡すと未読があるときヘッダーに表示する */
  onMarkAllAsRead?: () => void
  isMarkingAllAsRead?: boolean
  /** 通知を開いたとき（既読化など） */
  onNotificationClick?: (id: string) => void
  /** 通知が 0 件のときに中央へ表示する文言 */
  emptyMessage?: string
  /** 次ページを読み込む（無限スクロール） */
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

/** 受信トレイ。通知が 0 件のときは空状態を表示する。 */
function NotificationPanel({
  className,
  notifications,
  title = '受信トレイ',
  onClose,
  onMarkAllAsRead,
  isMarkingAllAsRead = false,
  onNotificationClick,
  emptyMessage = '通知が届いていません',
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: NotificationPanelProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const loadMoreRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const root = listRef.current
    const target = loadMoreRef.current
    if (!root || !target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { root, threshold: 0.1 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, isLoadingMore, notifications.length])

  return (
    <div
      data-slot="notification-panel"
      className={cn(
        'flex h-full min-h-0 w-full flex-col gap-6 overflow-hidden rounded-lg bg-background-2 p-6',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="shrink-0 text-heading-3 text-foreground">{title}</h2>
          {onMarkAllAsRead && (
            <Button
              type="button"
              size="default"
              variant="primary"
              className="shrink-0"
              leftIcon={<IconCheck className="size-full" />}
              onClick={onMarkAllAsRead}
              isDisabled={isMarkingAllAsRead}
            >
              すべて既読
            </Button>
          )}
        </div>
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
        <ul
          ref={listRef}
          className="scrollbar-custom flex min-h-0 flex-1 flex-col divide-y divide-border-3 overflow-y-auto overscroll-y-contain"
        >
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
          {hasMore && (
            <li ref={loadMoreRef} className="flex justify-center py-4">
              {isLoadingMore && <Spinner />}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export type { NotificationPanelEntry, NotificationPanelProps }
export { NotificationPanel }
