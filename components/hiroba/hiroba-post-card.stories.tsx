import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { HirobaPostCard } from './hiroba-post-card'

const meta = {
  component: HirobaPostCard,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof HirobaPostCard>

export default meta
type Story = StoryObj<typeof meta>

const basePost = {
  id: 'hiroba-post-1',
  hirobaSlug: 'alcohol',
  title: '今日のランチどこ行きました？',
  body: '近くに新しくできたお店に行ってみたら、とても美味しかったです。おすすめのお店があれば教えてください。',
  displayName: '田中太郎',
  isOwnPost: false,
  likeCount: 2,
  liked: false,
  saved: false,
  answerCount: 1,
  tags: [{ id: 'tag-1', name: 'Next.js' }],
  createdAt: '2024-01-20T00:00:00Z',
}

export const Default: Story = {
  args: { post: basePost },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/今日のランチ/)).toBeVisible()
    await expect(canvas.getByText('田中太郎')).toBeVisible()
    await expect(canvas.getByText('返信')).toBeVisible()
  },
}

export const OwnPost: Story = {
  args: { post: { ...basePost, isOwnPost: true } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { pressed: false, name: /^\d+$/ })).toBeNull()
  },
}
