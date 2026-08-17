import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { BookmarkButton } from './bookmark-button'

const meta = {
  component: BookmarkButton,
  args: {
    count: 0,
  },
} satisfies Meta<typeof BookmarkButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 'default', defaultPressed: false },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '0' })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  },
}

export const Pressed: Story = {
  args: { size: 'default', count: 1, defaultPressed: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '1' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Large: Story = {
  args: { size: 'large', count: 1, defaultPressed: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '1' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Disabled: Story = {
  args: { size: 'default', count: 1, disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '1' })).toBeDisabled()
  },
}
