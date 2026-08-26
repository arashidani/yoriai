import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { SendButton } from './send-button'

const meta = {
  component: SendButton,
} satisfies Meta<typeof SendButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: '送信' })
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
    // Figma: primary/primary = #ff8560, 50x50 の円
    await expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 133, 96)' })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: { isDisabled: true, onClick: fn() },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '送信' })
    await expect(button).toBeDisabled()
    // disabled は muted / muted-foreground（Button と同じ扱い）
    await expect(button).toHaveStyle({
      backgroundColor: 'rgb(246, 243, 237)',
      color: 'rgb(165, 154, 141)',
    })
  },
}

export const CustomLabel: Story = {
  args: { 'aria-label': 'メッセージを送信', onClick: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'メッセージを送信' })).toBeVisible()
  },
}

export const InInputArea: Story = {
  args: { onClick: fn() },
  render: (args) => (
    <div className="flex w-[420px] items-center gap-2 rounded-full border border-input bg-card p-2 pl-4">
      <p className="flex-1 text-muted-foreground text-paragraph-small">メッセージを入力</p>
      <SendButton {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '送信' })).toBeVisible()
  },
}
