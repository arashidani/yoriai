import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { HirobaFeed } from './hiroba-feed'

const meta = {
  component: HirobaFeed,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof HirobaFeed>

export default meta
type Story = StoryObj<typeof meta>

const posts = [
  {
    id: 'hiroba-post-1',
    hirobaSlug: 'hiroba-1',
    title: '今日のランチどこ行きました？',
    body: '近くに新しくできたお店に行ってみました。',
    displayName: '田中太郎',
    isOwnPost: false,
    likeCount: 2,
    liked: false,
    saved: false,
    answerCount: 1,
    tags: [{ id: 'tag-1', name: 'Next.js' }],
    createdAt: '2024-01-20T00:00:00Z',
  },
]

export const Default: Story = {
  args: {
    hirobaSlug: 'hiroba-1',
    posts,
    isAdmin: false,
    allTags: [{ id: 'tag-1', name: 'Next.js' }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/今日のランチ/)).toBeVisible()
    await expect(canvas.getByText('投稿する')).toBeVisible()
  },
}
