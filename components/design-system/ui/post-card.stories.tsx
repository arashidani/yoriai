import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'
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
  id: 'hiroba-post-1',
  hirobaSlug: 'alcohol',
  title: 'title',
  body: '近くに新しくできたお店に行ってみました。おすすめがあれば教えてください。',
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
}

export const Default: Story = {
  args: { post: basePost, joined: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/近くに新しく/)).toBeVisible()
    await expect(canvas.getByText('田中太郎')).toBeVisible()
    await expect(canvas.getByText('チームで')).toBeVisible()
    await expect(canvas.getByRole('link', { name: '田中太郎のプロフィール' })).toHaveAttribute(
      'href',
      '/mypage/user-1',
    )
    await expect(canvas.queryByRole('link', { name: '田中太郎' })).toBeNull()
  },
}

export const WithImage: Story = {
  args: {
    post: { ...basePost, imageUrl: 'https://example.com/hiroba-post.webp' },
    joined: true,
  },
  play: async ({ canvasElement }) => {
    const postImage = canvasElement.querySelector('img[src*="hiroba-post.webp"]')
    await expect(postImage).toBeVisible()
  },
}

export const OwnPost: Story = {
  args: { post: { ...basePost, isOwnPost: true }, joined: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: '田中太郎のプロフィール' })).toHaveAttribute(
      'href',
      '/mypage',
    )
    await expect(canvas.getByRole('button', { name: /2/ })).toBeDisabled()
  },
}

export const NotJoined: Story = {
  args: { post: basePost, joined: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /2/ })).toBeDisabled()
  },
}

export const WithPostHref: Story = {
  args: {
    post: basePost,
    joined: true,
    postHref: '/hiroba/alcohol/posts/hiroba-post-1',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'title' })).toHaveAttribute(
      'href',
      '/hiroba/alcohol/posts/hiroba-post-1',
    )
    await expect(canvas.getByRole('link', { name: '田中太郎のプロフィール' })).toHaveAttribute(
      'href',
      '/mypage/user-1',
    )
  },
}

export const WithUrl: Story = {
  args: {
    post: {
      ...basePost,
      body: 'お店のサイトは https://example.com です。おすすめがあれば教えてください。',
    },
    joined: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'href',
      'https://example.com/',
    )
  },
}

export const Muted: Story = {
  args: { post: basePost, joined: true, state: 'muted' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /2/ })).toBeVisible()
  },
}

export const Borderless: Story = {
  args: { post: basePost, joined: true, border: 'none' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('田中太郎')).toBeVisible()
  },
}

export const NoAuthor: Story = {
  args: {
    post: { ...basePost, authorId: null, displayName: '削除されたユーザー' },
    joined: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('削除されたユーザー')).toBeVisible()
    await expect(canvas.queryByRole('link', { name: '削除されたユーザー' })).toBeNull()
  },
}

export const AsAdmin: Story = {
  args: { post: basePost, joined: true, isAdmin: true, onDeleted: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '投稿を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await waitFor(() => expect(args.onDeleted).toHaveBeenCalledWith('hiroba-post-1'))
  },
}

export const AsMember: Story = {
  args: { post: basePost, joined: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '投稿を削除' })).toBeNull()
  },
}
