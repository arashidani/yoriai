'use client'

import { useEffect } from 'react'
import { NotificationPanel } from '@/components/design-system/ui/notification-panel'
import { Spinner } from '@/components/ui/spinner'
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/use-notifications'
import { toNotificationEntry } from '@/lib/notifications/notification-entry'
import { useNotificationPanelStore } from '@/lib/stores/notification-panel-store'

/**
 * サイドバーとメインコンテンツの間に差し込む受信トレイ。
 * Figma ではオーバーレイではなく独立した列で、開くとメインが右へ狭まる。
 * 画面が狭いときは列にすると入らないので、オーバーレイとして重ねる。
 */
export function NotificationPanelColumn() {
  const isOpen = useNotificationPanelStore((state) => state.isOpen)
  const close = useNotificationPanelStore((state) => state.close)
  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications(isOpen)
  const unreadCount = useUnreadNotificationCount()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  if (!isOpen) return null

  const apiNotifications = data?.pages.flatMap((page) => page.notifications) ?? []
  const notifications = apiNotifications.map((notification) => toNotificationEntry(notification))

  return (
    <aside
      data-slot="notification-panel-column"
      className="fixed inset-0 z-50 overflow-hidden bg-black/10 p-4 lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-screen lg:max-h-screen lg:w-[350px] lg:shrink-0 lg:self-start lg:overflow-hidden lg:bg-transparent"
    >
      {isPending ? (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-background-2">
          <Spinner className="size-8 text-primary" aria-label="読み込み中" />
        </div>
      ) : (
        <NotificationPanel
          notifications={notifications}
          onClose={close}
          onMarkAllAsRead={
            unreadCount > 0 ? () => markAllAsRead.mutate() : undefined
          }
          isMarkingAllAsRead={markAllAsRead.isPending}
          onNotificationClick={(id) => {
            const target = apiNotifications.find((notification) => notification.id === id)
            if (target && !target.isRead) markAsRead.mutate(id)
            close()
          }}
          onLoadMore={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          emptyMessage={isError ? '通知を取得できませんでした' : undefined}
        />
      )}
    </aside>
  )
}
