import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MyQuestionsListFallback } from './my-questions-list-fallback'

const meta = {
  component: MyQuestionsListFallback,
} satisfies Meta<typeof MyQuestionsListFallback>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
