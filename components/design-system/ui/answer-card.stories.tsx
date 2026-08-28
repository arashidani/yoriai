import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerCard } from './answer-card'

const meta = {
  component: AnswerCard,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof AnswerCard>

export default meta
type Story = StoryObj<typeof meta>

const baseAnswer = {
  id: 'hiroba-answer-1',
  body: 'いいですね、今度行ってみます！',
  authorId: 'user-2',
  displayName: 'じろちゃん',
  displayNameColor: 'YELLOW' as const,
  avatarUrl: null,
  lunchPreference: 'ALONE' as const,
  isOwnAnswer: false,
  likeCount: 3,
  createdAt: '2024-01-20T00:00:00Z',
}

export const Default: Story = {
  args: { answer: baseAnswer, liked: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('いいですね、今度行ってみます！')).toBeVisible()
    await expect(canvas.getByText('じろちゃん')).toBeVisible()
    await expect(canvas.getByText('ひとりで')).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'じろちゃん' })).toHaveAttribute(
      'href',
      '/mypage/user-2',
    )
  },
}

export const Liked: Story = {
  args: { answer: baseAnswer, liked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /3/ })).toHaveAttribute('aria-pressed', 'true')
  },
}

export const OwnAnswer: Story = {
  args: { answer: { ...baseAnswer, isOwnAnswer: true }, liked: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'じろちゃん' })).toHaveAttribute(
      'href',
      '/mypage',
    )
    await expect(canvas.queryByRole('button', { name: /3/ })).toBeNull()
  },
}

export const WithMention: Story = {
  args: { answer: baseAnswer, liked: false, mentionNames: ['たろちゃん'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('たろちゃんさん')).toBeVisible()
  },
}

export const WithUrl: Story = {
  args: {
    answer: { ...baseAnswer, body: 'お店のサイトは https://example.com です。' },
    liked: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'href',
      'https://example.com/',
    )
  },
}

export const NoAuthor: Story = {
  args: {
    answer: { ...baseAnswer, authorId: null, displayName: '削除されたユーザー' },
    liked: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('削除されたユーザー')).toBeVisible()
    await expect(canvas.queryByRole('link', { name: '削除されたユーザー' })).toBeNull()
  },
}
