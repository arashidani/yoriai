import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { HirobaPostForm } from './hiroba-post-form'

const meta = {
  component: HirobaPostForm,
} satisfies Meta<typeof HirobaPostForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('投稿のタイトル')).toBeVisible()
    await expect(canvas.getByLabelText('画像（任意）')).toBeVisible()
  },
}

export const Submitting: Story = {
  args: { onSubmit: fn(), isSubmitting: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /送信中/ })).toBeDisabled()
  },
}

export const ValidationErrors: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /投稿する/ }))
    await expect(await canvas.findByText('タイトルは必須です')).toBeVisible()
  },
}

export const DroppedImage: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(new File(['image'], 'hiroba.png', { type: 'image/png' }))
    const dropzone = canvas.getByRole('button', { name: /画像を追加/ })
    dropzone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer }))
    dropzone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }))
    await waitFor(() => expect(canvas.getByAltText('選択した画像のプレビュー')).toBeVisible())
  },
}
