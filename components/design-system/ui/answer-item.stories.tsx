import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerItem } from './answer-item'

const meta = {
  component: AnswerItem,
  args: {
    authorName: '名無しのおせワニ',
    tenure: 'IBJ歴',
    timestamp: '2時間前',
    body: '基本は8時間で申請します。半休の場合は4時間ですね。\n詳しくは社内ポータルの〇〇ページを見てみてください。',
    likeCount: 0,
  },
} satisfies Meta<typeof AnswerItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByText('IBJ歴')).toBeVisible()
    await expect(canvas.getByText('2時間前')).toBeVisible()
  },
}

export const NoTenure: Story = {
  args: { tenure: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('IBJ歴')).not.toBeInTheDocument()
  },
}

export const Liked: Story = {
  args: { likeCount: 3, liked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3')).toBeVisible()
  },
}
