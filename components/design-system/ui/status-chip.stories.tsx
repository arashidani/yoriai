import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { StatusChip } from './status-chip'

const meta = {
  component: StatusChip,
} satisfies Meta<typeof StatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: { status: 'OPEN' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('回答募集中')).toBeVisible()
  },
}

export const Resolved: Story = {
  args: { status: 'RESOLVED' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('解決済み')).toBeVisible()
  },
}
