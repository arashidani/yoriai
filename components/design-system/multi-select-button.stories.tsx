import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { MultiSelectButton } from './multi-select-button'

const meta = {
  component: MultiSelectButton,
} satisfies Meta<typeof MultiSelectButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'マーケティング',
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'マーケティング' })).toBeVisible()
  },
}

export const Selected: Story = {
  args: {
    text: 'マーケティング',
    isSelected: true,
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'マーケティング' })).toBeVisible()
  },
}

export const Click: Story = {
  args: {
    text: '営業',
    onClick: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '営業' }))
    await expect(args.onClick).toHaveBeenCalled()
  },
}
