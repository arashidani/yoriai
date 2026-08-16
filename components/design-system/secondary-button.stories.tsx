import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { SecondaryButton } from './secondary-button'

const meta = {
  component: SecondaryButton,
} satisfies Meta<typeof SecondaryButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onClick: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '戻る' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '戻る' })).toBeEnabled()
  },
}
