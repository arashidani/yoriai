import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen, userEvent } from 'storybook/test'
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
    imageUrl: null,
    authorId: 'user-1',
    displayName: '田中太郎',
    displayNameColor: 'BLUE' as const,
    lunchPreference: 'NO_PREFERENCE' as const,
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
      icon: 'wine',
      tone: 'lime',
    },
    posts,
    popularPosts: [
      {
        id: 'hiroba-post-popular',
        hirobaSlug: 'gaming',
        title: 'いま人気のゲームを教えてください',
      },
    ],
    isAdmin: false,
    initialJoined: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/今日のランチ/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: /いま人気のゲーム/ })).toHaveAttribute(
      'href',
      '/hiroba/gaming/posts/hiroba-post-popular',
    )
    await expect(canvas.getByRole('button', { name: '投稿する' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '参加する' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(canvas.getByText('AI要約')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '2', pressed: false })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '返信' }))
    await expect(screen.getByRole('dialog')).toBeVisible()
    await expect(screen.getByRole('button', { name: '参加する' })).toBeVisible()
  },
}
