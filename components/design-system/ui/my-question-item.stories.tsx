import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MyQuestionItem } from './my-question-item'

const meta = {
  component: MyQuestionItem,
  args: {
    date: '2026/9/1',
    title: 'キングオブタイムの有給申請について',
    category: 'カテゴリー',
    excerpt:
      'お疲れ様です！！！質問したいのですが、何時間労働で申請するんですか？何時間労働で申請するんですか？何時間労働で申請するんですか？',
    commentCount: 0,
    status: 'OPEN',
  },
} satisfies Meta<typeof MyQuestionItem>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('キングオブタイムの有給申請について')).toBeVisible()
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '募集を終了する' })).toBeVisible()
  },
}

export const Resolved: Story = {
  args: { status: 'RESOLVED' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('解決済み')).toBeVisible()
  },
}

export const NoCategory: Story = {
  args: { category: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('カテゴリー')).not.toBeInTheDocument()
  },
}

export const WithLink: Story = {
  args: { href: '/questions/1' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link')).toHaveAttribute('href', '/questions/1')
  },
}
