import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { HirobaPostList } from './hiroba-post-list'

const meta = {
  component: HirobaPostList,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof HirobaPostList>

export default meta
type Story = StoryObj<typeof meta>

const posts = [
  {
    id: 'hiroba-post-1',
    hirobaSlug: 'alcohol',
    title: '今日のランチどこ行きました？',
    body: '近くに新しくできたお店に行ってみました。',
    imageUrl: null,
    authorId: 'user-1',
    displayName: '田中太郎',
    displayNameColor: 'BLUE' as const,
    isOwnPost: false,
    likeCount: 2,
    liked: false,
    saved: false,
    answerCount: 1,
    tags: [],
    createdAt: '2024-01-20T00:00:00Z',
  },
]

export const Default: Story = {
  args: { posts, isAdmin: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/今日のランチ/)).toBeVisible()
  },
}

export const Empty: Story = {
  args: { posts: [], isAdmin: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ投稿がありません。')).toBeVisible()
  },
}
