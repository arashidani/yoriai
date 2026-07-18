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
    await expect(canvas.getByText('おせっかいQA')).toBeVisible()
    await expect(canvas.getByText('ミッション')).toBeVisible()
    await expect(canvas.getByText('マイページ')).toBeVisible()
    await expect(canvas.getByLabelText('通知')).toBeVisible()
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
    nextjs: { appDirectory: true, navigation: { pathname: '/posts/new' } },
  },
  play: async ({ canvas }) => {
    // /posts/* でも「おせっかいQA」がアクティブ表示になる
    const qaLink = canvas.getByText('おせっかいQA').closest('a')
    await expect(qaLink).toHaveClass(/bg-muted/)
  },
}
