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

export const WithUrl: Story = {
  args: {
    text: '社内ポータルは https://example.com を見てください。 @ねこ さんにも共有済みです。',
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'https://example.com' })
    await expect(link).toHaveAttribute('href', 'https://example.com/')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(canvas.getByText('@ねこ')).toHaveClass('text-primary')
  },
}
