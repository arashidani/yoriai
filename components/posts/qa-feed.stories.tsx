import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, HttpResponse, http } from 'msw'
import { expect, userEvent, waitFor } from 'storybook/test'
import { formatRelativeTime } from '@/lib/date-time'
import { useQaFeedFilterStore } from '@/lib/stores/qa-feed-filter-store'
import { QaFeed } from './qa-feed'

const meta = {
  component: QaFeed,
  parameters: {
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => {
      useQaFeedFilterStore.getState().resetFilters()
      return (
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <Story />
        </QueryClientProvider>
      )
    },
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
    bookmarkCount: 0,
    saved: false,
    status: 'RESOLVED' as const,
    answerCount: 1,
    tags: [{ id: 'tag-1', name: 'Next.js' }],
    createdAt: '2024-01-10T00:00:00Z',
    activityAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    timestamp: formatRelativeTime('2024-01-12T00:00:00Z'),
  },
  {
    id: 'post-2',
    title: 'TypeScriptの型エラーを解決したい',
    body: '`Type string is not assignable to type number` というエラーが出ます。',
    displayName: 'いぬ',
    isOwnQuestion: false,
    likeCount: 0,
    liked: false,
    bookmarkCount: 0,
    saved: false,
    status: 'OPEN' as const,
    answerCount: 0,
    tags: [{ id: 'tag-2', name: 'TypeScript' }],
    createdAt: '2024-01-11T00:00:00Z',
    activityAt: '2024-01-11T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z',
    timestamp: formatRelativeTime('2024-01-11T00:00:00Z'),
  },
]

/** 絞り込み後は msw 経由で fixtures の質問が返るため、id / 名前を fixtures と揃える。 */
const baseCategories = [
  {
    id: 'tag-category-1',
    name: '社内ルール・手続き',
    tags: [
      { id: 'tag-1', name: '勤怠・有給関連' },
      { id: 'tag-2', name: '経費精算' },
      { id: 'tag-3', name: '福利厚生' },
    ],
  },
]

export const Default: Story = {
  args: {
    posts: basePosts,
    isAdmin: false,
    tagCategories: baseCategories,
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
  args: { isAdmin: false, tagCategories: baseCategories },
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
  args: { posts: basePosts, isAdmin: false, tagCategories: baseCategories },
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
  args: { posts: basePosts, isAdmin: false, tagCategories: baseCategories },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    await userEvent.click(canvas.getByRole('checkbox', { name: '勤怠・有給関連' }))
    // tag-1 を持つのは post-1 / post-4
    await expect(await canvas.findByText(/有給休暇の申請方法/)).toBeVisible()
    await expect(canvas.getByText(/会議室設備の使い方/)).toBeVisible()
    await waitFor(() => expect(canvas.queryByText(/経費精算の申請期限/)).not.toBeInTheDocument())
  },
}

/** post-3 は公開 tag が福利厚生だが、第2 PostTag に経費精算がある。some 判定で返ること。 */
export const TagFilterSecondaryTag: Story = {
  args: { posts: basePosts, isAdmin: false, tagCategories: baseCategories },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    await userEvent.click(canvas.getByRole('checkbox', { name: '経費精算' }))
    await expect(await canvas.findByText(/経費精算の申請期限/)).toBeVisible()
    await expect(await canvas.findByText(/利用できる福利厚生を知りたい/)).toBeVisible()
  },
}

export const StatusFilter: Story = {
  args: { posts: basePosts, isAdmin: false, tagCategories: baseCategories },
  play: async ({ canvas }) => {
    const resolved = canvas.getByRole('button', { name: '解決済み' })
    await userEvent.click(resolved)
    await expect(resolved).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: '全て' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    // RESOLVED は post-3 のみ
    await expect(await canvas.findByText(/利用できる福利厚生を知りたい/)).toBeVisible()
    await waitFor(() => expect(canvas.queryByText(/有給休暇の申請方法/)).not.toBeInTheDocument())
    await expect(canvas.queryByText(/Next\.js App Router/)).not.toBeInTheDocument()

    const unanswered = canvas.getByRole('button', { name: '回答募集中' })
    await userEvent.click(unanswered)
    await expect(await canvas.findByText(/有給休暇の申請方法/)).toBeVisible()
    await waitFor(() =>
      expect(canvas.queryByText(/利用できる福利厚生を知りたい/)).not.toBeInTheDocument(),
    )
  },
}

export const KeywordFilter: Story = {
  args: { posts: basePosts, isAdmin: false, tagCategories: baseCategories },
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
    tagCategories: baseCategories,
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
  args: {
    posts: [],
    isAdmin: false,
    tagCategories: baseCategories,
    initialTotal: 0,
    initialTotalPages: 0,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
    await expect(canvas.queryByText(/件中/)).not.toBeInTheDocument()
  },
}
