import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { PostForm } from './post-form'

const meta = {
  component: PostForm,
} satisfies Meta<typeof PostForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    const titleInput = canvas.getByLabelText('タイトル')
    await expect(titleInput).toBeVisible()
    const bodyTextarea = canvas.getByLabelText('本文')
    await expect(bodyTextarea).toBeVisible()
  },
}

export const Submitting: Story = {
  args: {
    onSubmit: fn(),
    isSubmitting: true,
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /送信中/ })
    await expect(button).toBeDisabled()
  },
}

export const ValidationErrors: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: /投稿する/ })
    await userEvent.click(button)
    await expect(await canvas.findByText('タイトルは必須です')).toBeVisible()
  },
}
