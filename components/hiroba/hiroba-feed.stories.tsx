import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent } from 'storybook/test'
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
    initialJoined: false,
    canJoin: true,
    isAdmin: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/近くに新しく/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: '一覧に戻る' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '参加する' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(canvas.getByText('チームで')).toBeVisible()
    await expect(canvas.getByRole('link', { name: '田中太郎のプロフィール' })).toHaveAttribute(
      'href',
      '/mypage/user-1',
    )
    await expect(canvas.queryByRole('link', { name: '田中太郎' })).toBeNull()
  },
}

export const Joined: Story = {
  args: {
    ...Default.args,
    initialJoined: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '参加中' })).toBeDisabled()
  },
}

/** 投稿すると、入力した本文がそのままフィードのカードに表示される。 */
export const CreatePost: Story = {
  args: {
    ...Default.args,
    initialJoined: true,
  },
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByPlaceholderText('今の気分をシェアしましょう'),
      '昨日餃子食べてビール飲んで寝ました！',
    )
    await userEvent.click(canvas.getByRole('button', { name: '送信' }))
    await expect(await canvas.findByText('昨日餃子食べてビール飲んで寝ました！')).toBeVisible()
  },
}

export const DifferentMbtiGroup: Story = {
  args: {
    ...Default.args,
    canJoin: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '参加する' })).toBeDisabled()
    await expect(canvas.getByText('参加できるのは、自分のグループの広場だけです。')).toBeVisible()
  },
}

/** 管理者にだけ、各投稿カードに削除ボタンが表示される。 */
export const AsAdmin: Story = {
  args: {
    ...Default.args,
    initialJoined: true,
    isAdmin: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('button', { name: '投稿を削除' })).toHaveLength(posts.length)
  },
}
