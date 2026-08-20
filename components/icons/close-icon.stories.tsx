import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { CloseIcon } from './close-icon'

const meta = {
  component: CloseIcon,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof CloseIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const img = canvas.getByRole('img', { hidden: true })
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('width', '36')
    await expect(img).toHaveAttribute('height', '36')
  },
}
