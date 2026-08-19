import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { MbtiButton } from './mbti-button'

const meta = {
  component: MbtiButton,
} satisfies Meta<typeof MbtiButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'INTJ',
    color: 'green',
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'INTJ' })).toBeVisible()
  },
}

export const Selected: Story = {
  args: {
    text: 'INTJ',
    color: 'blue',
    isSelected: true,
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'INTJ' })).toBeVisible()
  },
}

export const Click: Story = {
  args: {
    text: 'ENFP',
    color: 'purple',
    onClick: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ENFP' }))
    await expect(args.onClick).toHaveBeenCalled()
  },
}
