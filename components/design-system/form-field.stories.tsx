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
    await expect(canvas.getByText('有効なメールアドレスを入力してください')).toBeVisible()
    await expect(canvas.getByDisplayValue('invalid-email')).toHaveAttribute('aria-invalid', 'true')
  },
}
