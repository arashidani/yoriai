'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/hono/client'

const NOTIFICATIONS_KEY = ['notifications'] as const
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const

/** 受信トレイに表示する通知一覧。パネルを開いている間だけ取得する。 */
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    enabled,
    queryFn: async () => {
      const res = await client.api.notifications.$get({ query: {} })
      if (!res.ok) throw new Error('通知の取得に失敗しました')
      return (await res.json()).notifications
    },
  })
}

/** サイドバーの未読ドット用。 */
export function useUnreadNotificationCount() {
  const { data } = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const res = await client.api.notifications['unread-count'].$get()
      if (!res.ok) throw new Error('未読件数の取得に失敗しました')
      return (await res.json()).count
    },
  })

  return data ?? 0
}

/** 通知を既読にする。一覧と未読件数の両方を再取得する。 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.notifications[':id'].$patch({ param: { id } })
      if (!res.ok) throw new Error('通知の既読化に失敗しました')
      return (await res.json()).notification
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY }),
      ])
    },
  })
}
