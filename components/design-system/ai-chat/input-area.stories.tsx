import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { InputArea } from './input-area'

const meta = {
  component: InputArea,
  decorators: [
    (Story) => (
      <div className="w-[455px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sendButtonProps: { onClick: fn() },
  },
  play: async ({ canvas, userEvent, args }) => {
    const textarea = canvas.getByPlaceholderText('よりあいぬに質問する')
    const button = canvas.getByRole('button', { name: '送信' })
    await expect(textarea).toBeVisible()
    await expect(button).toBeVisible()
    await userEvent.click(button)
    await expect(args.sendButtonProps?.onClick).toHaveBeenCalled()
  },
}

export const Typing: Story = {
  args: {
    textareaProps: { onChange: fn() },
    sendButtonProps: { onClick: fn() },
  },
  play: async ({ canvas, userEvent, args }) => {
    const textarea = canvas.getByPlaceholderText('よりあいぬに質問する')
    await userEvent.type(textarea, '育休明けの働き方について教えて')
    await expect(textarea).toHaveValue('育休明けの働き方について教えて')
    await expect(args.textareaProps?.onChange).toHaveBeenCalled()
  },
}

export const SendDisabled: Story = {
  args: {
    sendButtonProps: { isDisabled: true },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '送信' })).toBeDisabled()
  },
}

export const CustomPlaceholder: Story = {
  args: {
    textareaProps: { placeholder: '相談したいことを入力' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('相談したいことを入力')).toBeVisible()
  },
}

export const InChatPanel: Story = {
  args: {
    sendButtonProps: { onClick: fn() },
  },
  render: (args) => (
    <div className="flex flex-col gap-4 rounded-2xl bg-background-subtle p-4">
      <p className="text-muted-foreground text-paragraph-small">…会話の続き…</p>
      <InputArea {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('よりあいぬに質問する')).toBeVisible()
  },
}
