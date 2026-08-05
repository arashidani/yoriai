import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect } from 'storybook/test'
import { HirobaList } from './hiroba-list'

const meta = {
  component: HirobaList,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof HirobaList>

export default meta
type Story = StoryObj<typeof meta>

const hirobas = [
  {
    id: 'hiroba-1',
    slug: 'hiroba-1',
    name: '広場１',
    description: 'みんなで話せる広場です。',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hiroba-2',
    slug: 'hiroba-2',
    name: '広場２',
    description: 'みんなで話せる広場です。',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

export const Default: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/admin/hiroba', () => HttpResponse.json({ hirobas }))] },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('広場１')).toBeVisible()
    await expect(canvas.getByText('広場２')).toBeVisible()
  },
}

export const Empty: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/admin/hiroba', () => HttpResponse.json({ hirobas: [] }))] },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('まだひろばがありません')).toBeVisible()
  },
}
