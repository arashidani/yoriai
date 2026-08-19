import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { BookmarkTabIcon } from '@/components/icons/bookmark-tab-icon'
import { PencilIcon } from '@/components/icons/pencil-icon'
import { TabBar } from './tab-bar'

const meta = {
  component: TabBar,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    items: [
      {
        value: 'posted',
        label: '投稿した質問',
        icon: <PencilIcon className="size-full text-primary" />,
      },
      {
        value: 'saved',
        label: '保存した質問',
        icon: <BookmarkTabIcon className="size-full text-amber-400" />,
      },
    ],
  },
} satisfies Meta<typeof TabBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'posted' },
  play: async ({ canvas }) => {
    const postedTab = canvas.getByRole('tab', { name: '投稿した質問' })
    const savedTab = canvas.getByRole('tab', { name: '保存した質問' })
    await expect(postedTab).toHaveAttribute('aria-selected', 'true')
    await expect(savedTab).toHaveAttribute('aria-selected', 'false')
  },
}

export const SavedSelected: Story = {
  args: { defaultValue: 'saved' },
  play: async ({ canvas }) => {
    const savedTab = canvas.getByRole('tab', { name: '保存した質問' })
    await expect(savedTab).toHaveAttribute('aria-selected', 'true')
  },
}

export const LinkedTabs: Story = {
  args: {
    value: 'posted',
    items: [
      {
        value: 'posted',
        label: '投稿した質問',
        icon: <PencilIcon className="size-full text-primary" />,
        href: '/my-questions?tab=posted&page=1',
      },
      {
        value: 'saved',
        label: '保存した質問',
        icon: <BookmarkTabIcon className="size-full text-amber-400" />,
        href: '/my-questions?tab=saved&page=1',
      },
    ],
  },
  play: async ({ canvas }) => {
    const postedTab = canvas.getByRole('tab', { name: '投稿した質問' })
    const savedTab = canvas.getByRole('tab', { name: '保存した質問' })
    await expect(postedTab).toHaveAttribute('href', '/my-questions?tab=posted&page=1')
    await expect(postedTab).toHaveAttribute('aria-selected', 'true')
    await expect(savedTab).toHaveAttribute('href', '/my-questions?tab=saved&page=1')
    await expect(savedTab).toHaveAttribute('aria-selected', 'false')
  },
}
