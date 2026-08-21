import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { delay, http } from 'msw'
import { expect, waitFor } from 'storybook/test'
import { uiMessageStreamResponse } from '../../.storybook/msw-handlers'
import { ChatPanel } from './chat-panel'

const meta = {
  component: ChatPanel,
  decorators: [
    (Story) => (
      <div className="h-140 w-96 rounded-2xl border border-border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/よりあいぬに相談/)).toBeVisible()
    await expect(canvas.getByLabelText('送信')).toBeDisabled()
  },
}

export const Empty: Story = Default

export const Answered: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('メッセージ'), '経費精算のやり方は？')
    await userEvent.click(canvas.getByLabelText('送信'))

    await expect(await canvas.findByText('経費精算のやり方は？')).toBeVisible()
    await waitFor(async () => {
      await expect(canvas.getByText(/モック回答です。/)).toBeVisible()
    })
    await expect(canvas.getByAltText('よりあいぬ')).toBeVisible()
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
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('メッセージ'), '経費精算のやり方は？')
    await userEvent.click(canvas.getByLabelText('送信'))

    // 回答が届くまでは考え中表示だけを出す
    await expect(await canvas.findByText('よりあいぬが考えています...')).toBeVisible()
    await expect(canvas.getAllByAltText('よりあいぬ')).toHaveLength(1)

    // 回答が流れ始めたら消える
    await expect(await canvas.findByText('遅れて届く回答です。')).toBeVisible()
    await waitFor(async () => {
      await expect(canvas.queryByText('よりあいぬが考えています...')).not.toBeInTheDocument()
    })
  },
}
