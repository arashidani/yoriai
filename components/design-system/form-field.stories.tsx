import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { FormField } from './form-field'

const meta = {
  component: FormField,
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'メールアドレス',
    inputProps: {
      id: 'email',
      type: 'email',
      placeholder: 'sample@ibjapan.jp',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('メールアドレス')).toBeVisible()
    await expect(canvas.getByPlaceholderText('sample@ibjapan.jp')).toBeVisible()
  },
}

export const WithError: Story = {
  args: {
    label: 'メールアドレス',
    error: '有効なメールアドレスを入力してください',
    inputProps: {
      id: 'email',
      type: 'email',
      defaultValue: 'invalid-email',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('invalid-email')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Required: Story = {
  args: {
    label: 'メールアドレス',
    isRequired: true,
    inputProps: { id: 'email', type: 'email' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('必須')).toBeVisible()
  },
}

export const WithCaption: Story = {
  args: {
    label: 'ニックネーム',
    caption: '100文字以内で入力してください',
    maxLength: 100,
    inputProps: { id: 'username' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('100文字以内で入力してください')).toBeVisible()
    await expect(canvas.getByLabelText('ニックネーム')).toHaveAttribute('maxlength', '100')
  },
}
