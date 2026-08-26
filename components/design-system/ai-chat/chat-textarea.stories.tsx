import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { SendButton } from '@/components/design-system/ai-chat/send-button'
import { ChatTextarea } from './chat-textarea'

const meta = {
  component: ChatTextarea,
} satisfies Meta<typeof ChatTextarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByPlaceholderText('よりあいぬに質問する')
    await expect(textarea).toBeVisible()
    // Figma: general/input = #ffffff, unofficial/border 3 = #ece7df, rounded-lg = 8px
    await expect(textarea).toHaveStyle({
      backgroundColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(236, 231, 223)',
      borderWidth: '2px',
      borderRadius: '8px',
    })
  },
}

export const Typing: Story = {
  args: { onChange: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const textarea = canvas.getByPlaceholderText('よりあいぬに質問する')
    await userEvent.type(textarea, '育休明けの働き方について教えて')
    await expect(textarea).toHaveValue('育休明けの働き方について教えて')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const CustomPlaceholder: Story = {
  args: { placeholder: '相談したいことを入力' },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('相談したいことを入力')).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeDisabled()
  },
}

export const InInputArea: Story = {
  render: () => (
    <div className="flex w-[455px] items-start gap-2">
      <ChatTextarea className="flex-1" />
      <SendButton />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '送信' })).toBeVisible()
  },
}
