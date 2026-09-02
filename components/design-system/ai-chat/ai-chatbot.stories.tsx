import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { MessageContainer } from '@/components/design-system/ai-chat/message-container'
import { AiChatbot } from './ai-chatbot'

const meta = {
  component: AiChatbot,
  parameters: {
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div className="h-[673px] w-[495px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiChatbot>

export default meta
type Story = StoryObj<typeof meta>

const BOT_GREETING = `お疲れ様だワンッ！！！
マイページの入力で困っていることなワン？
ボクが走って答えや仲間を探してくるワン！`

/** Figma の AIchatbot をそのまま再現したもの */
export const Default: Story = {
  args: {
    headerProps: { onRefresh: fn(), onClose: fn() },
    bodyProps: {
      isLoading: true,
      inputAreaProps: { sendButtonProps: { onClick: fn() } },
    },
  },
  render: (args) => (
    <AiChatbot {...args}>
      <MessageContainer type="ai" size="body">
        {BOT_GREETING}
      </MessageContainer>
      <MessageContainer type="user" size="body" className="self-end">
        よりあいぬの好きな食べ物は何？
      </MessageContainer>
      <MessageContainer type="ai" size="body">
        ...
      </MessageContainer>
    </AiChatbot>
  ),
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('よりあいぬの小屋')).toBeVisible()
    await expect(canvas.getByText(/お疲れ様だワンッ/)).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('よりあいぬが考え中')
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'チャットを閉じる' }))
    await expect(args.headerProps?.onClose).toHaveBeenCalled()
  },
}

export const Idle: Story = {
  args: { headerProps: { onRefresh: fn(), onClose: fn() } },
  render: (args) => (
    <AiChatbot {...args}>
      <MessageContainer type="ai" size="body">
        こんにちは。どんなことでお困りですか？
      </MessageContainer>
    </AiChatbot>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('こんにちは。どんなことでお困りですか？')).toBeVisible()
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { headerProps: { onRefresh: fn(), onClose: fn() } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('よりあいぬの小屋')).toBeVisible()
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeVisible()
  },
}

const MANY_MESSAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
  id: `msg-${n}`,
  type: n % 2 === 1 ? ('ai' as const) : ('user' as const),
  text: `${n}件目のメッセージです`,
}))

/** メッセージ一覧だけがスクロールし、ヘッダーと入力欄が固定されることの確認 */
export const Scrollable: Story = {
  args: { headerProps: { onRefresh: fn(), onClose: fn() } },
  render: (args) => (
    <AiChatbot {...args}>
      {MANY_MESSAGES.map((message) => (
        <MessageContainer
          key={message.id}
          type={message.type}
          size="body"
          className={message.type === 'user' ? 'self-end' : undefined}
        >
          {message.text}
        </MessageContainer>
      ))}
    </AiChatbot>
  ),
  play: async ({ canvas, canvasElement }) => {
    const area = canvasElement.querySelector('[data-slot="message-area"]')
    if (!area) throw new Error('message-area が見つかりません')
    await expect(area.scrollHeight).toBeGreaterThan(area.clientHeight)
    // ヘッダーと入力欄はスクロール領域の外にある
    await expect(area.contains(canvas.getByText('よりあいぬの小屋'))).toBe(false)
    await expect(area.contains(canvas.getByPlaceholderText('よりあいぬに質問する'))).toBe(false)
  },
}
