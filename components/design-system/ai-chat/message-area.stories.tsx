import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MessageContainer } from '@/components/design-system/ai-chat/message-container'
import { MessageArea } from './message-area'

const meta = {
  component: MessageArea,
  decorators: [
    (Story) => (
      <div className="h-[479px] w-[455px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageArea>

export default meta
type Story = StoryObj<typeof meta>

const BOT_GREETING = `お疲れ様だワンッ！！！
マイページの入力で困っていることなワン？
ボクが走って答えや仲間を探してくるワン！`

/** Figma の MessageArea をそのまま再現したもの */
export const Default: Story = {
  args: { isLoading: true },
  render: (args) => (
    <MessageArea {...args}>
      <MessageContainer type="ai" size="body">
        {BOT_GREETING}
      </MessageContainer>
      <MessageContainer type="user" size="body" className="self-end">
        よりあいぬの好きな食べ物は何？
      </MessageContainer>
      <MessageContainer type="ai" size="body">
        ...
      </MessageContainer>
    </MessageArea>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/お疲れ様だワンッ/)).toBeVisible()
    await expect(canvas.getByText('よりあいぬの好きな食べ物は何？')).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('よりあいぬが考え中')
  },
}

export const Idle: Story = {
  render: () => (
    <MessageArea>
      <MessageContainer type="ai" size="body">
        こんにちは。どんなことでお困りですか？
      </MessageContainer>
      <MessageContainer type="user" size="body" className="self-end">
        育休明けの働き方について相談したいです。
      </MessageContainer>
    </MessageArea>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('こんにちは。どんなことでお困りですか？')).toBeVisible()
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const area = canvasElement.querySelector('[data-slot="message-area"]')
    await expect(area).toBeInTheDocument()
    await expect(area).toBeEmptyDOMElement()
  },
}

export const CustomLoadingText: Story = {
  args: { isLoading: true, loadingText: '回答を組み立て中' },
  render: (args) => (
    <MessageArea {...args}>
      <MessageContainer type="user" size="body" className="self-end">
        よろしくお願いします
      </MessageContainer>
    </MessageArea>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('回答を組み立て中')
  },
}

const MANY_MESSAGES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  id: `msg-${n}`,
  type: n % 2 === 1 ? ('ai' as const) : ('user' as const),
  text: `${n}件目のメッセージです`,
}))

/** 溢れたときにスクロールすることの確認 */
export const Scrollable: Story = {
  args: { isLoading: true },
  render: (args) => (
    <MessageArea {...args}>
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
    </MessageArea>
  ),
  play: async ({ canvasElement }) => {
    const area = canvasElement.querySelector('[data-slot="message-area"]')
    if (!area) throw new Error('message-area が見つかりません')
    await expect(area.scrollHeight).toBeGreaterThan(area.clientHeight)
  },
}
