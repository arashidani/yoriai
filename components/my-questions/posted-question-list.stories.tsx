import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PostedQuestionList } from './posted-question-list'

const meta = {
  component: PostedQuestionList,
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
} satisfies Meta<typeof PostedQuestionList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '募集を終了する' })).toBeVisible()
    await expect(canvas.getByText('解決済み')).toBeVisible()
  },
}

export const EndRecruiting: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '募集を終了する' })
    await userEvent.click(button)
    await expect(await within(document.body).findAllByText('解決済み')).toHaveLength(2)
  },
}
