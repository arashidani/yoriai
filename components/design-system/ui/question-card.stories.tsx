import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QuestionCard } from './question-card'

const meta = {
  component: QuestionCard,
  args: {
    authorName: '名無しのおせワニ',
    date: '2026/9/1',
    category: 'カテゴリー',
    status: 'OPEN',
    title: 'キングオブタイムの有給申請について',
    body: 'お疲れ様です！！！\n質問したいのですが、何時間労働で申請するんですか？\n\n何卒よろしくお願いいたします。',
    commentCount: 2,
    likeCount: 0,
    bookmarkCount: 0,
  },
} satisfies Meta<typeof QuestionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByText('キングオブタイムの有給申請について')).toBeVisible()
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
    await expect(canvas.getByText('回答募集中')).toBeVisible()
    await expect(canvas.getByText('2026/9/1')).toBeVisible()
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

export const WithCounts: Story = {
  args: { likeCount: 5, liked: true, bookmarkCount: 3, bookmarked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3')).toBeVisible()
    await expect(canvas.getByText('5')).toBeVisible()
  },
}
