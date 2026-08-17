import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { CategoryChip } from './category-chip'

const meta = {
  component: CategoryChip,
  args: {
    children: 'カテゴリー',
  },
} satisfies Meta<typeof CategoryChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 'default' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
  },
}

export const Large: Story = {
  args: { size: 'large' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
  },
}
