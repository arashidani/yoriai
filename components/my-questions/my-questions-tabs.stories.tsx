import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { MyQuestionsNavigationProvider } from './my-questions-navigation'
import { type MyQuestionsTab, MyQuestionsTabs } from './my-questions-tabs'

const meta = {
  component: MyQuestionsTabs,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <MyQuestionsNavigationProvider>
        <Story />
      </MyQuestionsNavigationProvider>
    ),
  ],
  args: { tab: 'posted' satisfies MyQuestionsTab },
} satisfies Meta<typeof MyQuestionsTabs>

export default meta
type Story = StoryObj<typeof meta>

export const PostedSelected: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: '投稿した質問' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.getByRole('tab', { name: '保存した質問' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  },
}

export const SavedSelected: Story = {
  args: { tab: 'saved' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: '保存した質問' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

function SwitchTabDemo() {
  const [tab, setTab] = useState<MyQuestionsTab>('posted')

  return (
    <MyQuestionsNavigationProvider
      onNavigate={(url) => {
        const params = new URL(url, 'http://localhost').searchParams
        setTab(params.get('tab') === 'saved' ? 'saved' : 'posted')
      }}
    >
      <MyQuestionsTabs tab={tab} />
    </MyQuestionsNavigationProvider>
  )
}

export const SwitchTab: Story = {
  render: () => <SwitchTabDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: '保存した質問' }))
    await expect(canvas.getByRole('tab', { name: '保存した質問' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}
