import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MessageContainer } from './message-container'

const meta = {
  component: MessageContainer,
} satisfies Meta<typeof MessageContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Ai: Story = {
  args: {
    type: 'ai',
    children: 'こんにちは。どんなことでお困りですか？',
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('こんにちは。どんなことでお困りですか？')).toBeVisible()
    // AI のときだけ よりあいぬ のアイコンが付く
    await expect(canvasElement.querySelector('img')).toBeInTheDocument()
  },
}

export const User: Story = {
  args: {
    type: 'user',
    children: '育休明けの働き方について相談したいです。',
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('育休明けの働き方について相談したいです。')).toBeVisible()
    // user はふきだしのみでアイコンは付かない
    await expect(canvasElement.querySelector('img')).toBeNull()
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

export const Conversation: Story = {
  args: {
    children: 'こんにちは',
  },
  render: () => (
    <div className="flex w-[420px] flex-col gap-4">
      <MessageContainer type="ai">こんにちは。どんなことでお困りですか？</MessageContainer>
      <MessageContainer type="user" className="self-end">
        育休明けの働き方について相談したいです。
      </MessageContainer>
      <MessageContainer type="ai">
        承知しました。まずは現在の勤務時間を教えてください。
      </MessageContainer>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('育休明けの働き方について相談したいです。')).toBeVisible()
  },
}
