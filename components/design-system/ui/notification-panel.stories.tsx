import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { NotificationPanel } from './notification-panel'

const meta = {
  component: NotificationPanel,
  parameters: {
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-[353px] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationPanel>

export default meta
type Story = StoryObj<typeof meta>

const notifications = [
  {
    id: 'notification-1',
    type: 'qa' as const,
    message: 'あなたの質問「TypeScriptの型エラーを解決したい」に新しい回答がつきました',
    timestamp: '2時間前',
    isRead: false,
    href: '/posts/post-1',
  },
  {
    id: 'notification-2',
    type: 'square' as const,
    message: 'あなたの投稿にいいねがつきました',
    timestamp: '2時間前',
    isRead: false,
    href: '/hiroba/alcohol/posts/hiroba-post-1',
  },
  {
    id: 'notification-3',
    type: 'qa' as const,
    message: 'あなたの質問「TypeScriptの型エラーを解決したい」に新しい回答がつきました',
    timestamp: '3日前',
    isRead: true,
    href: '/posts/post-2',
  },
]

export const Default: Story = {
  args: { notifications, onClose: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: '受信トレイ' })).toBeVisible()
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3)
    await expect(canvas.getAllByText('未読')).toHaveLength(2)
    await expect(canvas.queryByText('通知が届いていません')).toBeNull()
  },
}

export const Empty: Story = {
  args: { notifications: [], onClose: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('通知が届いていません')).toBeVisible()
    await expect(canvas.queryAllByRole('listitem')).toHaveLength(0)
  },
}

export const Close: Story = {
  args: { notifications, onClose: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}

/** onClose を渡さない場合は閉じるボタンを出さない（ページ内に常設するときなど） */
export const WithoutCloseButton: Story = {
  args: { notifications },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '閉じる' })).toBeNull()
  },
}

export const ClickNotification: Story = {
  args: { notifications, onClose: fn(), onNotificationClick: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getAllByRole('link')[0])
    await expect(args.onNotificationClick).toHaveBeenCalledWith('notification-1')
  },
}

export const MarkAllAsRead: Story = {
  args: { notifications, onClose: fn(), onMarkAllAsRead: fn() },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: 'すべて既読' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'すべて既読' }))
    await expect(args.onMarkAllAsRead).toHaveBeenCalled()
  },
}

export const LoadMore: Story = {
  args: {
    notifications,
    onClose: fn(),
    hasMore: true,
    isLoadingMore: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
