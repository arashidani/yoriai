import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { TenureChip } from './tenure-chip'

const meta = {
  component: TenureChip,
  args: {
    children: 'IBJ歴',
  },
} satisfies Meta<typeof TenureChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 'default' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('IBJ歴')).toBeVisible()
  },
}

export const Large: Story = {
  args: { size: 'large' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('IBJ歴')).toBeVisible()
  },
}
