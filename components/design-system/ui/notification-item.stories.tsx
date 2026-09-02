import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { NotificationItem } from './notification-item'

const meta = {
  component: NotificationItem,
  parameters: {
    nextjs: { appDirectory: true },
  },
  args: {
    type: 'qa',
    message: 'あなたの質問「TypeScriptの型エラーを解決したい」に新しい回答がつきました',
    timestamp: '2時間前',
  },
  decorators: [
    (Story) => (
      <div className="w-[321px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationItem>

export default meta
type Story = StoryObj<typeof meta>

export const Qa: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/新しい回答がつきました/)).toBeVisible()
    await expect(canvas.getByText('2時間前')).toBeVisible()
    await expect(canvas.getByText('未読')).toBeInTheDocument()
  },
}

export const Square: Story = {
  args: {
    type: 'square',
    message: 'あなたの投稿に新しいコメントがつきました',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('あなたの投稿に新しいコメントがつきました')).toBeVisible()
  },
}

export const Like: Story = {
  args: {
    type: 'like',
    message: 'あなたの質問にいいねがつきました',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('あなたの質問にいいねがつきました')).toBeVisible()
  },
}

export const Read: Story = {
  args: { isRead: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('未読')).toBeNull()
  },
}

export const WithHref: Story = {
  args: { href: '/posts/post-1' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveAttribute('href', '/posts/post-1')
  },
}

/** 受信トレイに並べたときの見え方（未読・既読・種別の混在） */
export const List: Story = {
  render: (args) => (
    <div className="flex flex-col rounded-lg bg-background-2 p-6">
      <NotificationItem {...args} />
      <hr className="border-border" />
      <NotificationItem {...args} type="like" message="あなたの質問にいいねがつきました" />
      <hr className="border-border" />
      <NotificationItem
        {...args}
        type="square"
        message="あなたの投稿に新しいコメントがつきました"
      />
      <hr className="border-border" />
      <NotificationItem {...args} isRead />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('2時間前')).toHaveLength(4)
    await expect(canvas.getAllByText('未読')).toHaveLength(3)
  },
}
