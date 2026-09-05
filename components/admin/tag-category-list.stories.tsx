import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { TagCategoryList } from './tag-category-list'

const meta = {
  component: TagCategoryList,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof TagCategoryList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/tag-categories', () =>
          HttpResponse.json({
            categories: [
              { id: 'category-1', name: '人事', createdAt: '2024-01-01T00:00:00Z' },
              { id: 'category-2', name: '交流', createdAt: '2024-01-01T00:00:00Z' },
            ],
          }),
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('人事')).toBeVisible()
    await expect(canvas.getByText('交流')).toBeVisible()
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/tag-categories', () => HttpResponse.json({ categories: [] })),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('まだカテゴリーがありません')).toBeVisible()
  },
}

const deleteCategorySpy = fn()

export const DeleteRequiresConfirmation: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/tag-categories', () =>
          HttpResponse.json({
            categories: [{ id: 'category-1', name: '人事', createdAt: '2024-01-01T00:00:00Z' }],
          }),
        ),
        http.delete('/api/admin/tag-categories/:id', ({ params }) => {
          deleteCategorySpy(params.id)
          return HttpResponse.json({ success: true })
        }),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    deleteCategorySpy.mockClear()

    await userEvent.click(await canvas.findByRole('button', { name: '人事を削除' }))
    await waitFor(() => expect(screen.getByText('カテゴリーを削除しますか？')).toBeVisible())
    await expect(deleteCategorySpy).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    await waitFor(() =>
      expect(screen.queryByText('カテゴリーを削除しますか？')).not.toBeInTheDocument(),
    )
    await expect(deleteCategorySpy).not.toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: '人事を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await waitFor(() => expect(deleteCategorySpy).toHaveBeenCalledWith('category-1'))
    await expect(await screen.findByText('カテゴリーを削除しました')).toBeInTheDocument()
  },
}
