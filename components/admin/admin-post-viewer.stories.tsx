import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect } from 'storybook/test'
import { AdminPostViewer } from './admin-post-viewer'

const meta = {
  component: AdminPostViewer,
  args: { postId: 'post-1' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof AdminPostViewer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('有給休暇の申請方法を教えてください')).toBeVisible()
    await expect(await canvas.findByText('公開中')).toBeVisible()
  },
}

export const HiddenPost: Story = {
  args: { postId: 'post-deleted' },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText('この投稿は非表示です。一般ユーザーには表示されません。'),
    ).toBeVisible()
    await expect(await canvas.findByText('削除済みの質問')).toBeVisible()
    await expect(await canvas.findByText('非表示になった回答です。')).toBeVisible()
    await expect(
      await canvas.findByText('投稿内に、脅迫・ハラスメントとみられる表現が含まれています'),
    ).toBeVisible()
    await expect(await canvas.findByRole('button', { name: '投稿を復元する' })).toBeVisible()
  },
}

export const NotFound: Story = {
  args: { postId: 'missing-post' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/posts/:id', () =>
          HttpResponse.json({ error: 'Not found' }, { status: 404 }),
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('投稿が見つかりません')).toBeVisible()
  },
}
