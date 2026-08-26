import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { Header } from './header'

const meta = {
  component: Header,
  decorators: [
    (Story) => (
      <div className="w-[495px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onRefresh: fn(), onClose: fn() },
  play: async ({ canvas, userEvent, args, canvasElement }) => {
    await expect(canvas.getByText('よりあいぬの小屋')).toBeVisible()

    const header = canvasElement.querySelector('[data-slot="chat-header"]')
    // Figma: primary/primary = #ff8560
    await expect(header).toHaveStyle({ backgroundColor: 'rgb(255, 133, 96)' })

    await userEvent.click(canvas.getByRole('button', { name: '会話をリセット' }))
    await expect(args.onRefresh).toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: 'チャットを閉じる' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const CustomTitle: Story = {
  args: { title: 'よりあいぬに相談', onRefresh: fn(), onClose: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('よりあいぬに相談')).toBeVisible()
  },
}

export const LongTitle: Story = {
  args: { title: 'よりあいぬの小屋へようこそ', onRefresh: fn(), onClose: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('よりあいぬの小屋へようこそ')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'チャットを閉じる' })).toBeVisible()
  },
}
