import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QuestionItemList } from './question-item-list'

const meta = {
  component: QuestionItemList,
  args: {
    items: [
      {
        id: 'q1',
        authorName: '名無しのおせワニ',
        category: 'カテゴリー',
        status: 'OPEN',
        timestamp: '2時間前',
        title: 'キングオブタイムの有給申請について',
        excerpt: 'お疲れ様です！！！質問したいのですが、何時間労働で申請するんですか？',
        commentCount: 0,
        likeCount: 0,
        bookmarkCount: 0,
      },
      {
        id: 'q2',
        authorName: '名無しのおせワニ',
        category: 'カテゴリー',
        status: 'RESOLVED',
        timestamp: '1日前',
        title: '育休の取得タイミングについて',
        excerpt: '育休はいつから申請するのがベストなのでしょうか？',
        commentCount: 4,
        likeCount: 2,
        bookmarkCount: 1,
      },
    ],
  },
} satisfies Meta<typeof QuestionItemList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('キングオブタイムの有給申請について')).toBeVisible()
    await expect(canvas.getByText('育休の取得タイミングについて')).toBeVisible()
    await expect(canvas.getByText('回答募集中')).toBeVisible()
    await expect(canvas.getByText('解決済み')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('キングオブタイムの有給申請について')).not.toBeInTheDocument()
  },
}
