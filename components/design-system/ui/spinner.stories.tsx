import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Spinner } from './spinner'

const meta = {
  component: Spinner,
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const spinner = canvas.getByRole('status', { name: '読み込み中' })
    await expect(spinner).toBeVisible()
    await expect(spinner).toHaveClass('text-primary')
  },
}

export const Center: Story = {
  args: { layout: 'center' },
  decorators: [
    (Story) => (
      <div className="flex min-h-80 flex-col rounded-lg border border-border bg-card">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const spinner = canvas.getByRole('status', { name: '読み込み中' })
    await expect(spinner).toBeVisible()
    await expect(spinner).toHaveClass('text-primary')
    await expect(spinner.parentElement).toHaveClass('items-center', 'justify-center')
  },
}

export const Overlay: Story = {
  args: { layout: 'overlay' },
  decorators: [
    (Story) => (
      <div className="relative min-h-80 rounded-lg border border-border bg-card p-6">
        <p className="text-paragraph text-foreground">読み込み中のコンテンツ</p>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const spinner = canvas.getByRole('status', { name: '読み込み中' })
    await expect(spinner).toBeVisible()
    await expect(spinner).toHaveClass('text-primary')
    await expect(spinner.parentElement).toHaveClass('absolute', 'items-center', 'justify-center')
  },
}
