import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QaFeedFiltersFallback } from './qa-feed-filters-fallback'

const meta = {
  component: QaFeedFiltersFallback,
} satisfies Meta<typeof QaFeedFiltersFallback>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
