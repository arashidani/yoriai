import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, within } from 'storybook/test'
import { QuestionFormModal } from './question-form-modal'

const meta = {
  component: QuestionFormModal,
} satisfies Meta<typeof QuestionFormModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('質問を投稿する')).toBeVisible()
    await expect(canvas.getByLabelText('質問のタイトル')).toBeVisible()
    await expect(canvas.getByLabelText('質問の本文')).toBeVisible()
    await expect(canvas.getByText('カテゴリー')).toBeVisible()
    await expect(
      canvas.getByText('カテゴリーを未選択で投稿した場合、AIが自動でカテゴリタグを付与します。'),
    ).toBeVisible()
    await expect(
      canvas.getByText(
        /※不適切と判断された投稿は運営により削除される可能性がございます。\s*※匿名アイコン・匿名ユーザーネームがランダムで付与されます。/,
      ),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: /投稿する/ })).toBeVisible()
  },
}

export const CategorySelect: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'カテゴリー' }))
    const body = within(document.body)
    await expect(await body.findByRole('option', { name: 'Next.js' })).toBeVisible()
    await userEvent.click(body.getByRole('option', { name: 'Next.js' }))
    await expect(canvas.getByRole('combobox', { name: 'カテゴリー' })).toHaveTextContent('Next.js')
  },
}

export const DisabledUntilFilled: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    const submitButton = canvas.getByRole('button', { name: /投稿する/ })
    await expect(submitButton).toBeDisabled()

    await userEvent.type(canvas.getByLabelText('質問のタイトル'), '有給申請の方法について')
    await expect(submitButton).toBeDisabled()

    await userEvent.type(canvas.getByLabelText('質問の本文'), '申請画面の場所が分かりません。')
    await expect(submitButton).toBeEnabled()
  },
}

export const Submit: Story = {
  args: {
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
    onSubmit: fn(),
    isSubmitting: true,
    onClose: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('質問を投稿する')).toBeVisible()
    await expect(canvas.getByRole('status', { name: '投稿中' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '閉じる' })).toBeDisabled()
    await expect(canvas.queryByLabelText('質問のタイトル')).not.toBeInTheDocument()
  },
}

export const ErrorState: Story = {
  args: {
    onSubmit: fn(),
    error: '通信に失敗しました。画面をリロードせず、もう一度お試しください',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '通信に失敗しました。画面をリロードせず、もう一度お試しください',
    )
  },
}
