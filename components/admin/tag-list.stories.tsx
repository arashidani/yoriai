import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect } from 'storybook/test'
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

export const Default: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/admin/tags', () => HttpResponse.json({ tags }))] },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('総務・労務')).toBeVisible()
    await expect(canvas.getByText('ランチ')).toBeVisible()
    await expect(canvas.getByText('総務・労務部門への相談に使用します。')).toBeVisible()
    await expect(canvas.getByText('AI向け説明なし')).toBeVisible()
  },
}

export const Empty: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/admin/tags', () => HttpResponse.json({ tags: [] }))] },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('まだタグがありません')).toBeVisible()
  },
}
