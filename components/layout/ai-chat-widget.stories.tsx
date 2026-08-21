import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AiChatWidget } from './ai-chat-widget'

const meta = {
  component: AiChatWidget,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AiChatWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('AIチャットサポートを開く')).toBeVisible()
    await expect(canvas.queryByLabelText('メッセージ')).not.toBeInTheDocument()
  },
}

export const Opened: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText('AIチャットサポートを開く'))
    await expect(await canvas.findByLabelText('メッセージ')).toBeVisible()
    await expect(canvas.getByLabelText('チャットを閉じる')).toBeVisible()
  },
}

export const ClosedAfterOpen: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText('AIチャットサポートを開く'))
    const input = await canvas.findByLabelText('メッセージ')
    await userEvent.click(canvas.getByLabelText('チャットを閉じる'))
    await expect(canvas.getByLabelText('AIチャットサポートを開く')).toBeVisible()
    await expect(input).toBeInTheDocument()
    await expect(input).not.toBeVisible()
  },
}
