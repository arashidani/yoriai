import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { MessageContainer } from '@/components/design-system/ai-chat/message-container'
import { Body } from './body'

const meta = {
  component: Body,
  decorators: [
    (Story) => (
      <div className="h-[589px] w-[495px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Body>

export default meta
type Story = StoryObj<typeof meta>

const BOT_GREETING = `お疲れ様だワンッ！！！
マイページの入力で困っていることなワン？
ボクが走って答えや仲間を探してくるワン！`

/** Figma の Body をそのまま再現したもの */
export const Default: Story = {
  args: {
    isLoading: true,
    inputAreaProps: { sendButtonProps: { onClick: fn() } },
  },
  render: (args) => (
    <Body {...args} className="h-full">
      <MessageContainer type="ai" size="body">
        {BOT_GREETING}
      </MessageContainer>
      <MessageContainer type="user" size="body" className="self-end">
        よりあいぬの好きな食べ物は何？
      </MessageContainer>
      <MessageContainer type="ai" size="body">
        ...
      </MessageContainer>
    </Body>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/お疲れ様だワンッ/)).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('よりあいぬが考え中')
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '送信' })).toBeVisible()
  },
}

export const Idle: Story = {
  render: () => (
    <Body className="h-full">
      <MessageContainer type="ai" size="body">
        こんにちは。どんなことでお困りですか？
      </MessageContainer>
    </Body>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('こんにちは。どんなことでお困りですか？')).toBeVisible()
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  render: () => <Body className="h-full" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeVisible()
  },
}
