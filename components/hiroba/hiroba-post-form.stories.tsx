import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn } from 'storybook/test'
import { HirobaPostForm } from './hiroba-post-form'

const meta = {
  component: HirobaPostForm,
} satisfies Meta<typeof HirobaPostForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('タイトル')).toBeVisible()
    await expect(canvas.getByLabelText('本文')).toBeVisible()
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
