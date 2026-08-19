import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { DifyChatWidget } from './dify-chat-widget'

const meta = {
  component: DifyChatWidget,
  args: {
    baseUrl: 'https://dify.example.invalid',
    token: 'storybook',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DifyChatWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('AIチャットサポートを開く')).toBeVisible()
    await expect(canvas.queryByTitle('AIチャットサポート')).not.toBeInTheDocument()
  },
}

export const Opened: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText('AIチャットサポートを開く'))
    await expect(await canvas.findByTitle('AIチャットサポート')).toBeVisible()
    await expect(canvas.getByLabelText('チャットを閉じる')).toBeVisible()
  },
}

export const ClosedAfterOpen: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText('AIチャットサポートを開く'))
    const frame = await canvas.findByTitle('AIチャットサポート')
    await userEvent.click(canvas.getByLabelText('チャットを閉じる'))
    await expect(canvas.getByLabelText('AIチャットサポートを開く')).toBeVisible()
    await expect(frame).toBeInTheDocument()
    await expect(frame).not.toBeVisible()
  },
}

export const Hidden: Story = {
  args: {
    baseUrl: '',
    token: '',
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByLabelText('AIチャットサポートを開く')).not.toBeInTheDocument()
  },
}
