import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Sidebar } from './sidebar'

const meta = {
  component: Sidebar,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { isAdmin: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ひろば')).toBeVisible()
    await expect(canvas.getByText('なんでもQ&A')).toBeVisible()
    await expect(canvas.queryByRole('link', { name: 'ミッション' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: '投稿・保存した質問' })).not.toBeInTheDocument()
    await expect(canvas.getByText('マイページ')).toBeVisible()
    await expect(canvas.getAllByLabelText('通知')[1]).toBeVisible()
    await expect(canvas.queryByText('管理者画面へ')).not.toBeInTheDocument()
  },
}

export const Admin: Story = {
  args: { isAdmin: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('管理者画面へ')).toBeVisible()
  },
}

export const PostsPageActive: Story = {
  args: { isAdmin: false },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/posts/post-1' } },
  },
  play: async ({ canvas }) => {
    // /posts/* でも「なんでもQ&A」がアクティブ表示になる
    const qaLink = canvas.getByText('なんでもQ&A').closest('a')
    await expect(qaLink).toHaveClass(/bg-muted/)
  },
}
