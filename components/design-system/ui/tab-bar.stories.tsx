import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Bookmark, PencilLine } from 'lucide-react'
import { expect } from 'storybook/test'
import { TabBar } from './tab-bar'

const meta = {
  component: TabBar,
  args: {
    items: [
      { value: 'posted', label: '投稿した質問', icon: <PencilLine className="size-full" /> },
      { value: 'saved', label: '保存した質問', icon: <Bookmark className="size-full" /> },
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
