import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ComponentProps } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import { AnswerForm } from './answer-form'

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

const meta = {
  component: AnswerForm,
  args: {
    onSubmit: fn((event: FormSubmitEvent) => event.preventDefault()),
  },
} satisfies Meta<typeof AnswerForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('回答を入力する')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /送信/ })).toBeVisible()
  },
}

export const Submit: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByPlaceholderText('回答を入力する'), 'テスト回答')
    await userEvent.click(canvas.getByRole('button', { name: /送信/ }))
    await expect(args.onSubmit).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('回答を入力する')).toBeDisabled()
    await expect(canvas.getByRole('button', { name: /送信/ })).toBeDisabled()
  },
}
