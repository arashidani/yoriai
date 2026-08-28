import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, userEvent, waitFor } from 'storybook/test'
import { Sidebar } from '@/components/layout/sidebar'
import { getQueryClient } from '@/lib/query-client'
import { useNotificationPanelStore } from '@/lib/stores/notification-panel-store'
import { resetMockNotificationReadState } from '../../.storybook/msw-handlers'
import { NotificationPanelColumn } from './notification-panel-column'

const meta = {
  component: NotificationPanelColumn,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      useNotificationPanelStore.setState({ isOpen: false })
      // ブラウザの QueryClient はシングルトンなので、前のストーリーの通知が残らないようにする
      getQueryClient().clear()
      resetMockNotificationReadState()
      return (
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar isAdmin={false} />
          <Story />
          <main className="flex min-w-0 flex-1 flex-col bg-background p-8">
            <p className="text-paragraph">メインコンテンツ</p>
          </main>
        </div>
      )
    },
  ],
} satisfies Meta<typeof NotificationPanelColumn>

export default meta
type Story = StoryObj<typeof meta>

/** 閉じているあいだは列ごと描画しないので、メインが全幅を使う */
export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('heading', { name: '受信トレイ' })).toBeNull()
  },
}

/** サイドバーの通知ボタンから開くと、サイドバーの隣に列として差し込まれる */
export const OpenFromSidebar: Story = {
  play: async ({ canvas }) => {
    const main = canvas.getByText('メインコンテンツ').closest('main')
    const widthBefore = main?.getBoundingClientRect().width ?? 0

    await userEvent.click(canvas.getByRole('button', { name: /^通知/ }))

    const heading = await canvas.findByRole('heading', { name: '受信トレイ' })
    await waitFor(() => expect(heading).toBeVisible())

    // QA / ひろば 両方の通知が並ぶ
    await expect(await canvas.findByText(/経費精算の申請期限/)).toBeVisible()
    await expect(canvas.getByText('あなたの投稿にいいねがつきました')).toBeVisible()

    // メインは通知の幅ぶん狭くなる（オーバーレイではなく列）
    await waitFor(() => expect(main?.getBoundingClientRect().width ?? 0).toBeLessThan(widthBefore))
  },
}

export const Close: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^通知/ }))
    await canvas.findByRole('heading', { name: '受信トレイ' })

    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await waitFor(() =>
      expect(canvas.queryByRole('heading', { name: '受信トレイ' })).not.toBeInTheDocument(),
    )
  },
}

/** 通知を開くと既読になり、サイドバーの未読ドットが消える */
export const MarkAsRead: Story = {
  play: async ({ canvas }) => {
    const notificationButton = canvas.getByRole('button', { name: /^通知/ })
    await waitFor(() => expect(notificationButton).toHaveAccessibleName(/未読通知/))

    await userEvent.click(notificationButton)
    await userEvent.click(await canvas.findByRole('link', { name: /経費精算の申請期限/ }))

    // 未読2件 → 1件
    await waitFor(() => expect(notificationButton).toHaveAccessibleName(/^通知\s*1件の未読通知$/))
  },
}

/** すべて既読でサイドバーの未読ドットが消える */
export const MarkAllAsRead: Story = {
  play: async ({ canvas }) => {
    const notificationButton = canvas.getByRole('button', { name: /^通知/ })
    await waitFor(() => expect(notificationButton).toHaveAccessibleName(/未読通知/))

    await userEvent.click(notificationButton)
    await userEvent.click(await canvas.findByRole('button', { name: 'すべて既読' }))

    await waitFor(() =>
      expect(notificationButton).toHaveAccessibleName(/^通知$/),
    )
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/notifications', () =>
          HttpResponse.json({ notifications: [], nextCursor: null }),
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^通知/ }))
    await expect(await canvas.findByText('通知が届いていません')).toBeVisible()
  },
}
