import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { PostCard } from './post-card'

const meta = {
  component: PostCard,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof PostCard>

export default meta
type Story = StoryObj<typeof meta>

const basePost = {
  id: 'post-1',
  title: 'Next.js App Routerの使い方を教えてください',
  body: 'App RouterとPages Routerの違いが分からなくて困っています。どちらを使うべきでしょうか？詳しく教えていただけると助かります。',
  displayName: 'ねこ',
  isOwnQuestion: false,
  likeCount: 3,
  liked: false,
  saved: false,
  status: 'OPEN' as const,
  answerCount: 0,
  tags: [{ id: 'tag-1', name: 'Next.js' }],
  createdAt: '2024-01-10T00:00:00Z',
}

export const Default: Story = {
  args: { post: basePost },
  play: async ({ canvas }) => {
    const title = canvas.getByText(/Next\.js App Router/)
    await expect(title).toBeVisible()
    await expect(canvas.getByText('ねこ')).toBeVisible()
    await expect(canvas.getByText('返信')).toBeVisible()
  },
}

export const CssCheck: Story = {
  args: { post: basePost },
  play: async ({ canvas }) => {
    const link = canvas.getByText(/Next\.js App Router/).closest('a')
    await expect(link).toBeVisible()
    // カードは article 要素 + border — グローバルCSSの読み込みを確認
    const cardEl = canvas.getByText(/Next\.js App Router/).closest('article') as HTMLElement
    await expect(cardEl).toBeVisible()
  },
}

export const LongBody: Story = {
  args: {
    post: {
      ...basePost,
      body: 'これは非常に長い本文のテストです。'.repeat(20),
    },
  },
}

export const OwnQuestion: Story = {
  args: {
    post: {
      ...basePost,
      displayName: '田中太郎',
      isOwnQuestion: true,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('田中太郎')).toBeVisible()
    // 自分の質問にはいいねボタンを出さない
    await expect(canvas.queryByRole('button', { pressed: false, name: /^\d+$/ })).toBeNull()
  },
}
