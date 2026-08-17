import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { QuestionCompletionModal } from './question-completion-modal'

const meta = {
  component: QuestionCompletionModal,
} satisfies Meta<typeof QuestionCompletionModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onConfirm: fn(),
    onClose: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('質問を投稿する')).toBeVisible()
    await expect(canvas.getByText('しっかり届けたワン！')).toBeVisible()
    await expect(canvas.getByText('質問の投稿が完了しました')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '投稿した質問を確認する' })).toBeVisible()
    // X ボタンとフッターのボタンが両方 aria-label/文言「閉じる」を持つため2件ヒットする
    await expect(canvas.getAllByRole('button', { name: '閉じる' })).toHaveLength(2)
  },
}

export const Interactions: Story = {
  args: {
    onConfirm: fn(),
    onClose: fn(),
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '投稿した質問を確認する' }))
    await expect(args.onConfirm).toHaveBeenCalledTimes(1)

    const [closeIconButton, closeTextButton] = canvas.getAllByRole('button', { name: '閉じる' })
    await userEvent.click(closeTextButton)
    await expect(args.onClose).toHaveBeenCalledTimes(1)

    await userEvent.click(closeIconButton)
    await expect(args.onClose).toHaveBeenCalledTimes(2)
  },
}
