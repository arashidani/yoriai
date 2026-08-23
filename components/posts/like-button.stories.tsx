import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { LikeButton } from './like-button'

const meta = {
  component: LikeButton,
} satisfies Meta<typeof LikeButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    initialLiked: false,
    initialLikeCount: 3,
    onToggle: fn(async (next: boolean) => ({ liked: next, likeCount: next ? 4 : 3 })),
  },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button')
    await expect(button).toHaveTextContent('3')
    await expect(button).not.toHaveClass(/text-action-like/)
    await userEvent.click(button)
    await expect(await canvas.findByText('4')).toBeVisible()
    await expect(args.onToggle).toHaveBeenCalledWith(true)
  },
}

export const Liked: Story = {
  args: {
    initialLiked: true,
    initialLikeCount: 4,
    onToggle: fn(async (next: boolean) => ({ liked: next, likeCount: next ? 4 : 3 })),
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveClass(/text-action-like/)
    await expect(button).toHaveClass(/bg-action-like\/10/)
  },
}
