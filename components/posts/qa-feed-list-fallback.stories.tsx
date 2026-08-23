import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QaFeedListFallback } from './qa-feed-list-fallback'

const meta = {
  component: QaFeedListFallback,
} satisfies Meta<typeof QaFeedListFallback>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
