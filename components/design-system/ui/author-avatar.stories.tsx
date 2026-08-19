import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'
import { AuthorAvatar } from './author-avatar'

const meta = {
  component: AuthorAvatar,
} satisfies Meta<typeof AuthorAvatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { src: '/anonymous-profiles/wani.png', alt: 'アバター' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'アバター' })).toBeVisible()
  },
}

export const MissingSrc: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull()
  },
}

export const NotFound: Story = {
  args: { src: '/anonymous-profiles/does-not-exist.svg', alt: 'アバター' },
  play: async ({ canvas }) => {
    await waitFor(() => {
      expect(canvas.queryByRole('img')).toBeNull()
    })
  },
}
