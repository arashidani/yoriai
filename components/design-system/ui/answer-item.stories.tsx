import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerItem } from './answer-item'

const meta = {
  component: AnswerItem,
  args: {
    avatarSrc: '/anonymous-profiles/cat.svg',
    avatarAlt: 'アバター',
    authorName: '名無しのおせワニ',
    tenure: 'IBJ歴',
    timestamp: '2時間前',
    body: '基本は8時間で申請します。半休の場合は4時間ですね。\n詳しくは社内ポータルの〇〇ページを見てみてください。',
    likeCount: 0,
  },
} satisfies Meta<typeof AnswerItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'アバター' })).toBeVisible()
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByText('IBJ歴')).toBeVisible()
    await expect(canvas.getByText('2時間前')).toBeVisible()
  },
}

export const NoTenure: Story = {
  args: { tenure: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('IBJ歴')).not.toBeInTheDocument()
  },
}

export const Liked: Story = {
  args: { likeCount: 3, liked: true },
  play: async ({ canvas }) => {
    const likeButton = canvas.getByRole('button', { name: '3' })
    await expect(likeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(likeButton).toHaveClass(/aria-pressed:text-action-like/)
  },
}

export const MostLiked: Story = {
  args: { likeCount: 14, isMostLiked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('ベストアンサー')).toBeVisible()
  },
}

export const MissingAvatar: Story = {
  args: { avatarSrc: undefined },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.queryByRole('img')).toBeNull()
    const avatar = canvasElement.querySelector('[data-slot="author-avatar"]')
    expect(avatar).toHaveClass('bg-primary')
  },
}
