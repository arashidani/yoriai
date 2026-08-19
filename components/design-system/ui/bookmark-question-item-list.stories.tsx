import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { BookmarkQuestionItemList } from './bookmark-question-item-list'

const meta = {
  component: BookmarkQuestionItemList,
  args: {
    items: [
      {
        id: 'q1',
        date: '2026/9/1',
        category: 'カテゴリー',
        status: 'OPEN',
        title: 'キングオブタイムの有給申請について',
        excerpt: 'お疲れ様です！！！質問したいのですが、何時間労働で申請するんですか？',
        commentCount: 0,
      },
      {
        id: 'q2',
        date: '2026/8/20',
        category: 'カテゴリー',
        status: 'RESOLVED',
        title: '育休の取得タイミングについて',
        excerpt: '育休はいつから申請するのがベストなのでしょうか？',
        commentCount: 4,
      },
    ],
  },
} satisfies Meta<typeof BookmarkQuestionItemList>

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
