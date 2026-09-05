import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect } from 'storybook/test'
import { MOCK_AI_FLAGS } from '@/lib/mocks/fixtures'
import { AiFlagList } from './ai-flag-list'

const meta = {
  component: AiFlagList,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof AiFlagList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('未確認 2 件')).toBeVisible()
    await expect(await canvas.findAllByRole('button', { name: '確認済みにする' })).toHaveLength(2)
    await expect(await canvas.findByText('この投稿は自動的に非表示になっています')).toBeVisible()
    await expect(await canvas.findByRole('link', { name: /該当の投稿を見る/ })).toHaveAttribute(
      'href',
      '/admin/posts/post-deleted',
    )
    await expect(await canvas.findByRole('link', { name: '該当の回答を見る' })).toHaveAttribute(
      'href',
      '/admin/posts/post-deleted#answer-answer-hidden',
    )
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get('/api/admin/ai-flags', () => HttpResponse.json({ flags: [] }))],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('フラグはありません')).toBeVisible()
  },
}

export const AllConfirmed: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/ai-flags', () =>
          HttpResponse.json({
            flags: MOCK_AI_FLAGS.map((f) => ({ ...f, status: 'CONFIRMED' })),
          }),
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByText('確認済み')).not.toHaveLength(0)
    await expect(canvas.queryByText(/未確認/)).not.toBeInTheDocument()
  },
}
