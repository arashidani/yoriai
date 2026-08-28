import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QuestionCard } from './question-card'
import { QuestionItemActions } from './question-item-actions'

const meta = {
  component: QuestionCard,
  args: {
    avatarSrc: '/anonymous-profiles/cat.svg',
    avatarAlt: 'アバター',
    authorName: '名無しのおせワニ',
    date: '2026/9/1',
    category: 'カテゴリー',
    status: 'OPEN',
    title: 'キングオブタイムの有給申請について',
    body: 'お疲れ様です！！！\n質問したいのですが、何時間労働で申請するんですか？\n\n何卒よろしくお願いいたします。',
  },
} satisfies Meta<typeof QuestionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'アバター' })).toBeVisible()
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByText('キングオブタイムの有給申請について')).toBeVisible()
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
    await expect(canvas.getByText('回答募集中')).toBeVisible()
    await expect(canvas.getByText('2026/9/1')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
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

export const WithActions: Story = {
  args: {
    actions: (
      <QuestionItemActions
        commentCount={3}
        likeCount={5}
        liked
        bookmarkCount={2}
        bookmarked
        size="large"
      />
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3')).toBeVisible()
    await expect(canvas.getByText('5')).toBeVisible()
    await expect(canvas.getByText('2')).toBeVisible()
  },
}

export const MissingAvatar: Story = {
  args: { avatarSrc: undefined },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.queryByRole('img')).toBeNull()
    const avatar = canvasElement.querySelector('[data-slot="author-avatar"]')
    expect(avatar).toHaveClass('bg-primary')
  },
}
