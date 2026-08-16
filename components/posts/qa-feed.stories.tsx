import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, HttpResponse, http } from 'msw'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { QaFeed } from './qa-feed'

const meta = {
  component: QaFeed,
  parameters: {
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof QaFeed>

export default meta
type Story = StoryObj<typeof meta>

const basePosts = [
  {
    id: 'post-1',
    title: 'Next.js App Routerの使い方を教えてください',
    body: 'App RouterとPages Routerの違いが分からなくて困っています。',
    displayName: 'ねこ',
    isOwnQuestion: false,
    likeCount: 3,
    liked: false,
    saved: false,
    status: 'RESOLVED' as const,
    answerCount: 1,
    tags: [{ id: 'tag-1', name: 'Next.js' }],
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'post-2',
    title: 'TypeScriptの型エラーを解決したい',
    body: '`Type string is not assignable to type number` というエラーが出ます。',
    displayName: 'いぬ',
    isOwnQuestion: false,
    likeCount: 0,
    liked: false,
    saved: false,
    status: 'OPEN' as const,
    answerCount: 0,
    tags: [{ id: 'tag-2', name: 'TypeScript' }],
    createdAt: '2024-01-11T00:00:00Z',
  },
]

const baseTags = [
  { id: 'tag-1', name: 'Next.js' },
  { id: 'tag-2', name: 'TypeScript' },
  { id: 'tag-3', name: 'Prisma' },
]

export const Default: Story = {
  args: {
    posts: basePosts,
    isAdmin: false,
    allTags: baseTags,
    initialTotal: 4,
    initialTotalPages: 1,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('キーワードを入力')).toBeVisible()
    await expect(canvas.getByText('カテゴリーを選択')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '全て' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
    await expect(canvas.getByText('4件中 1~4件を表示')).toBeVisible()
    await expect(canvas.queryByRole('navigation', { name: 'ページ送り' })).not.toBeInTheDocument()
  },
}

export const Loading: Story = {
  args: { isAdmin: false, allTags: baseTags },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/questions', async () => {
          await delay('infinite')
          return HttpResponse.json({
            questions: [],
            pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
          })
        }),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}

export const Refetching: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/questions', async () => {
          await delay('infinite')
          return HttpResponse.json({
            questions: [],
            pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
          })
        }),
      ],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '解決済み' }))
    await expect(await canvas.findByRole('status', { name: '読み込み中' })).toBeVisible()
    await expect(canvas.getByText(/Next\.js App Router/)).toBeVisible()
  },
}

export const TagFilter: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Next.js' }))
    await expect(await canvas.findByText(/Next\.jsのエラーを解決したい/)).toBeVisible()
    await expect(canvas.queryByText(/TypeScriptの型エラー/)).not.toBeInTheDocument()
  },
}

/** post-3 は公開 tag が Prisma だが、第2 PostTag に TypeScript がある。some 判定で返ること。 */
export const TagFilterSecondaryTag: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'TypeScript' }))
    await expect(await canvas.findByText(/TypeScriptの型エラー/)).toBeVisible()
    await expect(await canvas.findByText(/Prismaでリレーション/)).toBeVisible()
  },
}

export const StatusFilter: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    const resolved = canvas.getByRole('button', { name: '解決済み' })
    await userEvent.click(resolved)
    await expect(resolved).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: '全て' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(await canvas.findByText(/Prismaでリレーション/)).toBeVisible()
    await expect(canvas.queryByText(/TypeScriptの型エラー/)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument()

    const unanswered = canvas.getByRole('button', { name: '回答募集中' })
    await userEvent.click(unanswered)
    await expect(await canvas.findByText(/TypeScriptの型エラー/)).toBeVisible()
    await expect(canvas.queryByText(/Prismaでリレーション/)).not.toBeInTheDocument()
  },
}

export const KeywordFilter: Story = {
  args: { posts: basePosts, isAdmin: false, allTags: baseTags },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), 'TypeScript')
    await expect(await canvas.findByText(/TypeScriptの型エラー/)).toBeVisible()
    await waitFor(() => expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument())
  },
}

export const NoMatch: Story = {
  args: {
    posts: basePosts,
    isAdmin: false,
    allTags: baseTags,
    initialTotal: 4,
    initialTotalPages: 1,
  },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), '存在しないキーワード')
    await expect(await canvas.findByText('まだ質問がありません。')).toBeVisible()
    await expect(canvas.queryByText(/件中/)).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { posts: [], isAdmin: false, allTags: baseTags, initialTotal: 0, initialTotalPages: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
    await expect(canvas.queryByText(/件中/)).not.toBeInTheDocument()
  },
}
