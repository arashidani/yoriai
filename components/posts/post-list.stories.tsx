import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { PostList } from './post-list'

const meta = {
  component: PostList,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof PostList>

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
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
    await expect(canvas.getByText(/TypeScriptの型エラー/)).toBeVisible()
    await expect(canvas.queryByLabelText('投稿を削除')).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { posts: [], isAdmin: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
  },
}

export const AdminCanDelete: Story = {
  args: { posts: basePosts, isAdmin: true },
  play: async ({ canvas }) => {
    const deleteButtons = canvas.getAllByLabelText('投稿を削除')
    await expect(deleteButtons).toHaveLength(2)

    await userEvent.click(deleteButtons[0])
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await expect(await screen.findByText('投稿を削除しました')).toBeInTheDocument()
    await expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument()
    await expect(canvas.getByText(/TypeScriptの型エラー/)).toBeVisible()
  },
}
