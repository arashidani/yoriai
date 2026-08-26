import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { delay, http } from 'msw'
import { expect, fn, waitFor } from 'storybook/test'
import { uiMessageStreamResponse } from '../../.storybook/msw-handlers'
import { ChatPanel } from './chat-panel'

const meta = {
  component: ChatPanel,
  decorators: [
    // ai-chat-widget のパネルと同じ大きさ（枠線・角丸・影は AiChatbot 側が持つ）
    (Story) => (
      <div className="h-160 w-128">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatPanel>

export default meta
type Story = StoryObj<typeof meta>

/** よりあいぬのアイコンは装飾扱い（alt="")なので DOM から数える */
function avatarCount(canvasElement: HTMLElement) {
  return canvasElement.querySelectorAll('[data-slot="message-container"] img').length
}

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('よりあいぬの小屋')).toBeVisible()
    await expect(canvas.getByText(/よりあいぬに相談/)).toBeVisible()
    await expect(canvas.getByLabelText('送信')).toBeDisabled()
  },
}

export const Empty: Story = Default

export const Answered: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('メッセージ'), '経費精算のやり方は？')
    await userEvent.click(canvas.getByLabelText('送信'))

    await expect(await canvas.findByText('経費精算のやり方は？')).toBeVisible()
    await waitFor(async () => {
      await expect(canvas.getByText(/モック回答です。/)).toBeVisible()
    })
    // 回答のふきだしにだけ よりあいぬ のアイコンが付く
    await expect(avatarCount(canvasElement)).toBe(1)
  },
}

export const Thinking: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/chat', async () => {
          await delay(400)
          return uiMessageStreamResponse([
            { type: 'start' },
            { type: 'text-start', id: 'text-1' },
            { type: 'text-delta', id: 'text-1', delta: '遅れて届く回答です。' },
            { type: 'text-end', id: 'text-1' },
            { type: 'finish' },
          ])
        }),
      ],
    },
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('メッセージ'), '経費精算のやり方は？')
    await userEvent.click(canvas.getByLabelText('送信'))

    // 回答が届くまでは考え中のピルだけを出す（ふきだしは増やさない）
    await expect(await canvas.findByText('よりあいぬが考えています...')).toBeVisible()
    await expect(avatarCount(canvasElement)).toBe(0)
    // 生成中は送信ボタンが中断ボタンに変わる
    await expect(canvas.getByLabelText('生成を中断')).toBeVisible()

    // 回答が流れ始めたら消える
    await expect(await canvas.findByText('遅れて届く回答です。')).toBeVisible()
    await waitFor(async () => {
      await expect(canvas.queryByText('よりあいぬが考えています...')).not.toBeInTheDocument()
    })
    await expect(avatarCount(canvasElement)).toBe(1)
  },
}

/** ヘッダーのリフレッシュで会話をやり直せる */
export const Refreshed: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('メッセージ'), '経費精算のやり方は？')
    await userEvent.click(canvas.getByLabelText('送信'))
    await expect(await canvas.findByText('経費精算のやり方は？')).toBeVisible()

    await userEvent.click(canvas.getByLabelText('会話をリセット'))
    await waitFor(async () => {
      await expect(canvas.queryByText('経費精算のやり方は？')).not.toBeInTheDocument()
    })
    await expect(canvas.getByText(/よりあいぬに相談/)).toBeVisible()
  },
}

/** ウィジェット側から閉じるためのハンドラ */
export const Closable: Story = {
  args: { onClose: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByLabelText('チャットを閉じる'))
    await expect(args.onClose).toHaveBeenCalled()
  },
}
