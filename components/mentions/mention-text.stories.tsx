import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MentionText } from './mention-text'

const meta = {
  component: MentionText,
  args: { text: '@ねこ さん、確認お願いします。' },
} satisfies Meta<typeof MentionText>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('@ねこ')).toHaveClass('text-primary')
  },
}
