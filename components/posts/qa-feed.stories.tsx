import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent } from 'storybook/test'
import { QaFeed } from './qa-feed'

const meta = {
  component: QaFeed,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof QaFeed>

export default meta
type Story = StoryObj<typeof meta>

const basePosts = [
  {
    id: 'post-1',
    title: 'Next.js App Routerの使い方を教えてください',
    body: 'App RouterとPages Routerの違いが分からなくて困っています。',
    displayName: 'ねこ',
    isOwnQuestion: false,
    likeCount: 3,
    liked: false,
    saved: false,
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'post-2',
    title: 'TypeScriptの型エラーを解決したい',
    body: '`Type string is not assignable to type number` というエラーが出ます。',
    displayName: 'いぬ',
    isOwnQuestion: false,
    likeCount: 0,
    liked: false,
    saved: false,
    createdAt: '2024-01-11T00:00:00Z',
  },
]

export const Default: Story = {
  args: { posts: basePosts, isAdmin: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('キーワードを入力')).toBeVisible()
    await expect(canvas.getByText('カテゴリーを選択')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'すべて' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
  },
}

export const StatusFilter: Story = {
  args: { posts: basePosts, isAdmin: false },
  play: async ({ canvas }) => {
    const resolved = canvas.getByRole('button', { name: '解決済み' })
    await userEvent.click(resolved)
    await expect(resolved).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: 'すべて' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}

export const KeywordFilter: Story = {
  args: { posts: basePosts, isAdmin: false },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), 'TypeScript')
    await expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument()
    await expect(canvas.getByText(/TypeScriptの型エラー/)).toBeVisible()
  },
}

export const NoMatch: Story = {
  args: { posts: basePosts, isAdmin: false },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), '存在しないキーワード')
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { posts: [], isAdmin: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
  },
}
