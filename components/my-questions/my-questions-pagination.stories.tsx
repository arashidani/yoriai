import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { MyQuestionsNavigationProvider } from './my-questions-navigation'
import { MyQuestionsPagination } from './my-questions-pagination'
import type { MyQuestionsTab } from './my-questions-tabs'

const meta = {
  component: MyQuestionsPagination,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <MyQuestionsNavigationProvider>
        <Story />
      </MyQuestionsNavigationProvider>
    ),
  ],
  args: {
    page: 2,
    totalPages: 5,
    total: 42,
    pageSize: 10,
    tab: 'posted' satisfies MyQuestionsTab,
  },
} satisfies Meta<typeof MyQuestionsPagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByText('42件中 11~20件を表示')).toBeVisible()
  },
}

function InteractiveDemo() {
  const [page, setPage] = useState(2)

  return (
    <MyQuestionsNavigationProvider
      onNavigate={(url) => {
        const params = new URL(url, 'http://localhost').searchParams
        setPage(Number(params.get('page')) || 1)
      }}
    >
      <MyQuestionsPagination page={page} totalPages={5} total={42} pageSize={10} tab="posted" />
    </MyQuestionsNavigationProvider>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '次へ' }))
    await expect(canvas.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByText('42件中 21~30件を表示')).toBeVisible()
  },
}
