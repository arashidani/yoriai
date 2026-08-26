import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Message } from './message'

const meta = {
  component: Message,
} satisfies Meta<typeof Message>

export default meta
type Story = StoryObj<typeof meta>

export const Ai: Story = {
  args: {
    type: 'ai',
    children: 'こんにちは。どんなことでお困りですか？',
  },
  play: async ({ canvas }) => {
    const message = canvas.getByText('こんにちは。どんなことでお困りですか？')
    await expect(message).toBeVisible()
    // Figma: unofficial/AIchat AI = #f6f3ed, AI foreground = #544d46
    await expect(message.parentElement).toHaveStyle({
      backgroundColor: 'rgb(246, 243, 237)',
      color: 'rgb(84, 77, 70)',
    })
  },
}

export const User: Story = {
  args: {
    type: 'user',
    children: '育休明けの働き方について相談したいです。',
  },
  play: async ({ canvas }) => {
    const message = canvas.getByText('育休明けの働き方について相談したいです。')
    await expect(message).toBeVisible()
    // Figma: unofficial/AIchat user = #33c1ed, user foreground = #fffefc
    await expect(message.parentElement).toHaveStyle({
      backgroundColor: 'rgb(51, 193, 237)',
      color: 'rgb(255, 254, 252)',
    })
  },
}

export const LongText: Story = {
  args: {
    type: 'ai',
    children:
      'ご相談ありがとうございます。まずは現在の勤務時間と業務内容を教えてください。そのうえで、時短勤務やフレックスタイム制など、利用できそうな制度をいくつかご提案します。',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/ご相談ありがとうございます。/)).toBeVisible()
  },
}

export const MultiLine: Story = {
  args: {
    type: 'user',
    children: '質問が2つあります。\n1つ目は時短勤務についてです。\n2つ目は在宅勤務についてです。',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/質問が2つあります。/)).toBeVisible()
  },
}

export const Conversation: Story = {
  args: {
    children: 'こんにちは',
  },
  render: () => (
    <div className="flex w-[320px] flex-col gap-3">
      <Message type="ai">こんにちは。どんなことでお困りですか？</Message>
      <div className="flex justify-end">
        <Message type="user">育休明けの働き方について相談したいです。</Message>
      </div>
      <Message type="ai">承知しました。まずは現在の勤務時間を教えてください。</Message>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('育休明けの働き方について相談したいです。')).toBeVisible()
  },
}
