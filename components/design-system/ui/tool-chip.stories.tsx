import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { ToolChip } from './tool-chip'

const meta = {
  component: ToolChip,
  args: {
    text: 'Tooltip text',
  },
} satisfies Meta<typeof ToolChip>

export default meta
type Story = StoryObj<typeof meta>

export const Top: Story = {
  args: { side: 'top' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tooltip text')).toBeVisible()
  },
}

export const Bottom: Story = {
  args: { side: 'bottom' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tooltip text')).toBeVisible()
  },
}

export const Left: Story = {
  args: { side: 'left' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tooltip text')).toBeVisible()
  },
}

export const Right: Story = {
  args: { side: 'right' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tooltip text')).toBeVisible()
  },
}
