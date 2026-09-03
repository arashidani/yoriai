import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { TagList } from './tag-list'

const meta = {
  component: TagList,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof TagList>

export default meta
type Story = StoryObj<typeof meta>

const tags = [
  {
    id: 'tag-1',
    name: '総務・労務',
    category: '部署',
    description: '総務・労務部門への相談に使用します。',
    isWorkTag: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-2',
    name: 'ランチ',
    category: '交流',
    description: null,
    isWorkTag: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
]

const categories = [
  { id: 'category-1', name: '部署', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'category-2', name: '交流', createdAt: '2024-01-01T00:00:00Z' },
]

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/tags', () => HttpResponse.json({ tags })),
        http.get('/api/admin/tag-categories', () => HttpResponse.json({ categories })),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('総務・労務')).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'カテゴリー' })).toBeVisible()
    await expect(canvas.getByText('ランチ')).toBeVisible()
    await expect(canvas.getByText('総務・労務部門への相談に使用します。')).toBeVisible()
    await expect(canvas.getByText('AI向け説明なし')).toBeVisible()
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/tags', () => HttpResponse.json({ tags: [] })),
        http.get('/api/admin/tag-categories', () => HttpResponse.json({ categories })),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('まだタグがありません')).toBeVisible()
  },
}

const deleteTagSpy = fn()

export const DeleteRequiresConfirmation: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/tags', () => HttpResponse.json({ tags })),
        http.get('/api/admin/tag-categories', () => HttpResponse.json({ categories })),
        http.delete('/api/admin/tags/:id', ({ params }) => {
          deleteTagSpy(params.id)
          return HttpResponse.json({ success: true })
        }),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    deleteTagSpy.mockClear()

    await userEvent.click(await canvas.findByRole('button', { name: 'ランチを削除' }))
    await waitFor(() => expect(screen.getByText('タグを削除しますか？')).toBeVisible())
    await waitFor(() =>
      expect(
        screen.getByText(
          '「ランチ」を削除します。このタグが付いている投稿からもタグが外れます。この操作は取り消せません。',
        ),
      ).toBeVisible(),
    )
    await expect(deleteTagSpy).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    await waitFor(() => expect(screen.queryByText('タグを削除しますか？')).not.toBeInTheDocument())
    await expect(deleteTagSpy).not.toHaveBeenCalled()
    await expect(canvas.getByText('ランチ')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'ランチを削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await waitFor(() => expect(deleteTagSpy).toHaveBeenCalledWith('tag-2'))
    await expect(await screen.findByText('タグを削除しました')).toBeInTheDocument()
  },
}
