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
  author: {
    id: 'user-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
  },
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
}

export const Default: Story = {
  args: { post: basePost },
  play: async ({ canvas }) => {
    const title = canvas.getByText(/Next\.js App Router/)
    await expect(title).toBeVisible()
  },
}

export const CssCheck: Story = {
  args: { post: basePost },
  play: async ({ canvas }) => {
    // CardActionArea renders an anchor via Next.js Link
    const link = canvas.getByText(/Next\.js App Router/).closest('a')
    await expect(link).toBeVisible()
    // Verify MUI theme/styles loaded — card root carries the MUI class
    const cardEl = canvas.getByText(/Next\.js App Router/).closest('.MuiCard-root') as HTMLElement
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

export const NoName: Story = {
  args: {
    post: {
      ...basePost,
      author: {
        id: 'user-2',
        name: null,
        email: 'noname@example.com',
      },
    },
  },
}
