import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerableQuestions } from './answerable-questions'

const meta = {
  component: AnswerableQuestions,
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'fullscreen',
  },
  // aside は xl 以上でのみ表示されるため、ストーリーでは常時表示にする
  decorators: [
    (Story) => (
      <div className="[&>aside]:block">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnswerableQuestions>

export default meta
type Story = StoryObj<typeof meta>

const basePosts = [
  { id: 'post-1', title: '夏季休暇って必須ですか？年末年始で5日達成している場合は不要でしょうか' },
  { id: 'post-2', title: 'IBJスタンダードについて教えてください。というのも上長に確認したところ…' },
  { id: 'post-3', title: 'Prismaでリレーションを使う方法' },
  { id: 'post-4', title: '4件目は表示されない' },
]

export const Default: Story = {
  args: { posts: basePosts },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('あなたが回答できそうな質問')).toBeVisible()
    await expect(canvas.getByText(/夏季休暇/)).toBeVisible()
    // 表示は3件まで
    await expect(canvas.queryByText(/4件目/)).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { posts: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
  },
}
