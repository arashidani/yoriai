import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { CommentCount } from './comment-count'

const meta = {
  component: CommentCount,
  args: {
    count: 0,
  },
} satisfies Meta<typeof CommentCount>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 'default' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('0')).toBeVisible()
  },
}

export const Large: Story = {
  args: { size: 'large' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('0')).toBeVisible()
  },
}

export const WithCount: Story = {
  args: { count: 12 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('12')).toBeVisible()
  },
}
