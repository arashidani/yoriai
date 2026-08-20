import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { IconBookmark } from '@/components/design-system/icons/icon-bookmark'
import { TabButton } from './tab-button'

const meta = {
  component: TabButton,
  args: {
    icon: <IconBookmark className="size-full text-amber-400" />,
    children: 'tab',
  },
} satisfies Meta<typeof TabButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultPressed: false },
  play: async ({ canvas }) => {
    const tab = canvas.getByRole('button', { name: 'tab' })
    await expect(tab).toHaveAttribute('aria-pressed', 'false')
  },
}

export const Selected: Story = {
  args: { defaultPressed: true },
  play: async ({ canvas }) => {
    const tab = canvas.getByRole('button', { name: 'tab' })
    await expect(tab).toHaveAttribute('aria-pressed', 'true')
  },
}
