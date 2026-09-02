import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { EmptyState } from './empty-state'

const meta = {
  component: EmptyState,
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const NoPostedQuestions: Story = {
  args: {
    variant: 'uruuru',
    message: 'ボクが質問を届けるワン！',
    title: 'まだ何も投稿していません',
    description: '質問一覧ページから質問を投稿することができます',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ何も投稿していません')).toBeVisible()
    await expect(canvas.getByText('質問一覧ページから質問を投稿することができます')).toBeVisible()
    await expect(canvas.getByText('ボクが質問を届けるワン！')).toBeVisible()
  },
}

export const NoSavedQuestions: Story = {
  args: {
    variant: 'closeEye',
    message: 'ボクはすぐ忘れちゃうワン',
    title: 'まだ何も保存していません',
    description: '見返したい質問や自分が回答した質問を保存しましょう',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ何も保存していません')).toBeVisible()
    await expect(
      canvas.getByText('見返したい質問や自分が回答した質問を保存しましょう'),
    ).toBeVisible()
  },
}
