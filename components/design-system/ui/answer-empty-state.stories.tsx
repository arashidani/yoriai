import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AnswerEmptyState } from './answer-empty-state'

const meta = {
  component: AnswerEmptyState,
} satisfies Meta<typeof AnswerEmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const NoAnswers: Story = {
  args: {
    variant: 'shikushiku',
    message: 'ボクもこれ\n気になるワンッ...',
    title: 'まだ回答がありません',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ回答がありません')).toBeVisible()
    await expect(canvas.getByText(/気になるワンッ/)).toBeVisible()
  },
}

export const Closed: Story = {
  args: {
    variant: 'xx',
    message: '答えが気になっちゃう\nワン！',
    title: '回答がありません',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('回答がありません')).toBeVisible()
    await expect(canvas.getByText(/答えが気になっちゃう/)).toBeVisible()
  },
}
