import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { SideQuestionItem } from './side-question-item'

const meta = {
  component: SideQuestionItem,
  args: {
    avatarSrc: '/anonymous-profiles/bread_scarlet.svg',
    avatarAlt: 'アバター',
    title: 'デリについて',
    excerpt: '17Fにだけハーゲンダッツがあると聞いたのですが本当ですか？',
  },
} satisfies Meta<typeof SideQuestionItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('デリについて')).toBeVisible()
    await expect(
      canvas.getByText('17Fにだけハーゲンダッツがあると聞いたのですが本当ですか？'),
    ).toBeVisible()
    await expect(canvas.getByRole('img', { name: 'アバター' })).toBeVisible()
  },
}

export const WithLink: Story = {
  args: { href: '/posts/post-1' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /デリについて/ })).toHaveAttribute(
      'href',
      '/posts/post-1',
    )
  },
}

export const MissingAvatar: Story = {
  args: { avatarSrc: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('デリについて')).toBeVisible()
    await expect(canvas.queryByRole('img')).toBeNull()
  },
}
