import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { QuestionFormModal } from './question-form-modal'

const meta = {
  component: QuestionFormModal,
} satisfies Meta<typeof QuestionFormModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    displayName: '名無しのおせワニ',
    avatarUrl: '/anonymous-profiles/wani.png',
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('質問を投稿する')).toBeVisible()
    await expect(canvas.getByText('名無しのおせワニ')).toBeVisible()
    await expect(canvas.getByLabelText('質問のタイトル')).toBeVisible()
    await expect(canvas.getByLabelText('質問の本文')).toBeVisible()
    await expect(
      canvas.getByText('AIが自動でカテゴリタグを付与し、回答されやすくします。'),
    ).toBeVisible()
  },
}

export const ValidationErrors: Story = {
  args: {
    displayName: '名無しのおせワニ',
    onSubmit: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /投稿する/ }))
    await expect(await canvas.findByText('タイトルは必須です')).toBeVisible()
    await expect(await canvas.findByText('本文は必須です')).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const Submit: Story = {
  args: {
    displayName: '名無しのおせワニ',
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('質問のタイトル'), '有給申請の方法について')
    await userEvent.type(canvas.getByLabelText('質問の本文'), '申請画面の場所が分かりません。')
    await userEvent.click(canvas.getByRole('button', { name: /投稿する/ }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      { title: '有給申請の方法について', body: '申請画面の場所が分かりません。' },
      expect.anything(),
    )
    await userEvent.click(canvas.getByRole('button', { name: '閉じる' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const Submitting: Story = {
  args: {
    displayName: '名無しのおせワニ',
    onSubmit: fn(),
    isSubmitting: true,
    onClose: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('質問を投稿する')).toBeVisible()
    await expect(canvas.getByRole('status', { name: 'Loading' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '閉じる' })).toBeDisabled()
    await expect(canvas.queryByLabelText('質問のタイトル')).not.toBeInTheDocument()
  },
}

export const Error: Story = {
  args: {
    displayName: '名無しのおせワニ',
    onSubmit: fn(),
    error: '通信に失敗しました。画面をリロードせず、もう一度お試しください',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '通信に失敗しました。画面をリロードせず、もう一度お試しください',
    )
  },
}
