import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerItemList } from './answer-item-list'

const meta = {
  component: AnswerItemList,
  args: {
    items: [
      {
        id: 'a1',
        authorName: '名無しのおせワニ',
        tenure: 'IBJ歴',
        timestamp: '2時間前',
        body: '基本は8時間で申請します。半休の場合は4時間ですね。',
        likeCount: 3,
      },
      {
        id: 'a2',
        authorName: '匿名希望のカバ',
        timestamp: '1日前',
        body: '社内ポータルの就業規則ページに記載があります。',
        likeCount: 0,
      },
    ],
  },
} satisfies Meta<typeof AnswerItemList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByText('匿名希望のカバ')).toBeVisible()
    await expect(canvas.getByText('IBJ歴')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('名無しのおせワニ')).not.toBeInTheDocument()
  },
}
