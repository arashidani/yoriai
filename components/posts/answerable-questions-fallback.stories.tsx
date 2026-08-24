import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerableQuestionsFallback } from './answerable-questions-fallback'

const meta = {
  component: AnswerableQuestionsFallback,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="[&>aside]:block">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnswerableQuestionsFallback>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('あなたが回答できそうな質問')).toBeVisible()
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
