import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { Separator } from '@/components/ui/separator'
import {
  MyQuestionsNavigationProvider,
  MyQuestionsNavigationShell,
} from './my-questions-navigation'
import { MyQuestionsListFallback } from './my-questions-list-fallback'
import { MyQuestionsPagination } from './my-questions-pagination'
import { PostedQuestionList } from './posted-question-list'
import { MyQuestionsTabs, type MyQuestionsTab } from './my-questions-tabs'

const postedItems = [
  {
    id: 'q1',
    date: '2026/9/1',
    category: 'カテゴリー',
    status: 'OPEN' as const,
    title: 'キングオブタイムの有給申請について',
    excerpt: 'お疲れ様です！！！質問したいのですが、何時間労働で申請するんですか？',
    commentCount: 0,
  },
  {
    id: 'q2',
    date: '2026/8/20',
    category: 'カテゴリー',
    status: 'RESOLVED' as const,
    title: '育休の取得タイミングについて',
    excerpt: '育休はいつから申請するのがベストなのでしょうか？',
    commentCount: 4,
  },
]

function parseMyQuestionsUrl(url: string): { tab: MyQuestionsTab; page: number } {
  const params = new URL(url, 'http://localhost').searchParams
  return {
    tab: params.get('tab') === 'saved' ? 'saved' : 'posted',
    page: Number(params.get('page')) || 1,
  }
}

function MyQuestionsSectionDemo({ loading = false }: { loading?: boolean }) {
  const [tab, setTab] = useState<MyQuestionsTab>('posted')
  const [page, setPage] = useState(1)

  function handleNavigate(url: string) {
    const next = parseMyQuestionsUrl(url)
    setTab(next.tab)
    setPage(next.page)
  }

  return (
    <MyQuestionsNavigationProvider onNavigate={handleNavigate}>
      <MyQuestionsNavigationShell className="w-full max-w-4xl">
        <MyQuestionsTabs tab={tab} />
        <Separator />
        {loading ? (
          <MyQuestionsListFallback />
        ) : (
          <>
            <PostedQuestionList items={postedItems} />
            <MyQuestionsPagination
              className="mt-6"
              page={page}
              totalPages={3}
              total={25}
              pageSize={10}
              tab={tab}
            />
          </>
        )}
      </MyQuestionsNavigationShell>
    </MyQuestionsNavigationProvider>
  )
}

const meta = {
  component: MyQuestionsSectionDemo,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof MyQuestionsSectionDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <MyQuestionsSectionDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: '投稿した質問' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.getByText('キングオブタイムの有給申請について')).toBeVisible()
    await expect(canvas.getByText('25件中 1~10件を表示')).toBeVisible()
  },
}

export const Loading: Story = {
  render: () => <MyQuestionsSectionDemo loading />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}

export const SwitchTab: Story = {
  render: () => <MyQuestionsSectionDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: '保存した質問' }))
    await expect(canvas.getByRole('tab', { name: '保存した質問' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}
