import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QuestionItem } from './question-item'

const meta = {
  component: QuestionItem,
  args: {
    avatarSrc: '/anonymous-profiles/cat.svg',
    avatarAlt: 'アバター',
    authorName: '名無しのおせワニ',
    category: 'カテゴリー',
    status: 'OPEN',
    timestamp: '2時間前',
    title: 'キングオブタイムの有給申請について',
    excerpt:
      'お疲れ様です！！！質問したいのですが、何時間労働で申請するんですか？何時間労働で申請するんですか？何時間労働で申請するんですか？',
    commentCount: 0,
    likeCount: 0,
    bookmarkCount: 0,
  },
} satisfies Meta<typeof QuestionItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'アバター' })).toBeVisible()
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByText('キングオブタイムの有給申請について')).toBeVisible()
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
    await expect(canvas.getByText('回答募集中')).toBeVisible()
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
  args: { commentCount: 3, likeCount: 5, liked: true, bookmarkCount: 2, bookmarked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3')).toBeVisible()
    await expect(canvas.getByText('5')).toBeVisible()
    await expect(canvas.getByText('2')).toBeVisible()
  },
}

export const OwnQuestion: Story = {
  args: { isOwnQuestion: true, likeCount: 7, bookmarkCount: 0 },
  play: async ({ canvas }) => {
    const likeButton = canvas.getByRole('button', { name: '7' })
    await expect(likeButton).toBeDisabled()
    await expect(likeButton).toHaveClass(/disabled:cursor-not-allowed/)
    await expect(canvas.getByRole('button', { name: '0' })).toBeVisible()
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

export const WithLink: Story = {
  args: {
    href: '/posts/post-1',
    postId: 'post-1',
    likeCount: 3,
    bookmarkCount: 1,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('link', { name: 'キングオブタイムの有給申請について' }),
    ).toHaveAttribute('href', '/posts/post-1')

    const likeButton = canvas.getByRole('button', { name: '3' })
    const rect = likeButton.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
    await expect(likeButton.contains(hit) || likeButton === hit).toBe(true)

    await userEvent.click(likeButton)
    await expect(canvas.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true')
  },
}
