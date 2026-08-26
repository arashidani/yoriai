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
    hirobaSlug: 'alcohol',
    title: '今日のランチどこ行きました？',
    body: '近くに新しくできたお店に行ってみました。',
    imageUrl: null,
    authorId: 'user-1',
    displayName: '田中太郎',
    displayNameColor: 'BLUE' as const,
    avatarUrl: null,
    lunchPreference: 'TEAM' as const,
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
    hiroba: {
      id: 'hiroba-alcohol',
      slug: 'alcohol',
      name: 'お酒',
      description: '好きなお酒やおすすめのおつまみを紹介し合うひろばです。',
      icon: 'alcohol',
      category: 'pickup',
    },
    posts,
    isAdmin: false,
    initialJoined: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/近くに新しく/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: '一覧に戻る' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '参加する' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(canvas.getByText('チームで')).toBeVisible()
    await expect(canvas.getByRole('link', { name: '田中太郎' })).toHaveAttribute(
      'href',
      '/mypage/user-1',
    )
  },
}
