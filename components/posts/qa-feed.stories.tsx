import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen, userEvent } from 'storybook/test'
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
    status: 'RESOLVED' as const,
    answerCount: 1,
    tags: [{ id: 'tag-1', name: 'Next.js' }],
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
    status: 'OPEN' as const,
    answerCount: 0,
    tags: [{ id: 'tag-2', name: 'TypeScript' }],
    createdAt: '2024-01-11T00:00:00Z',
  },
]

const baseTags = [
  { id: 'tag-1', name: 'Next.js' },
  { id: 'tag-2', name: 'TypeScript' },
]

export const Default: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('キーワードを入力')).toBeVisible()
    await expect(canvas.getByText('タグで絞り込み')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'すべて' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
  },
}

export const TagFilter: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('タグで絞り込み'))
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Next.js' }))
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
    await expect(canvas.queryByText(/TypeScriptの型エラー/)).not.toBeInTheDocument()
  },
}

export const StatusFilter: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    const resolved = canvas.getByRole('button', { name: '解決済み' })
    await userEvent.click(resolved)
    await expect(resolved).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: 'すべて' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
    await expect(canvas.queryByText(/TypeScriptの型エラー/)).not.toBeInTheDocument()

    const unanswered = canvas.getByRole('button', { name: '未回答' })
    await userEvent.click(unanswered)
    await expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument()
    await expect(canvas.getByText(/TypeScriptの型エラー/)).toBeVisible()
  },
}

export const KeywordFilter: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), 'TypeScript')
    await expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument()
    await expect(canvas.getByText(/TypeScriptの型エラー/)).toBeVisible()
  },
}

export const NoMatch: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), '存在しないキーワード')
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { posts: [], isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
  },
}
