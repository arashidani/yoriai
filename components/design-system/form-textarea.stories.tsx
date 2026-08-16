import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { FormTextarea } from './form-textarea'

const meta = {
  component: FormTextarea,
} satisfies Meta<typeof FormTextarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: '一言',
    textareaProps: {
      id: 'bio',
      placeholder: '自己紹介を入力してください',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('一言')).toBeVisible()
    await expect(canvas.getByPlaceholderText('自己紹介を入力してください')).toBeVisible()
  },
}

export const Required: Story = {
  args: {
    label: '一言',
    isRequired: true,
    textareaProps: { id: 'bio' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('必須')).toBeVisible()
  },
}

export const WithCaption: Story = {
  args: {
    label: '一言',
    caption: '200文字以内で入力してください',
    maxLength: 200,
    textareaProps: { id: 'bio' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('200文字以内で入力してください')).toBeVisible()
  },
}

export const WithError: Story = {
  args: {
    label: '一言',
    error: '一言は200文字以内で入力してください',
    textareaProps: { id: 'bio', defaultValue: 'a'.repeat(201) },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('a'.repeat(201))).toHaveAttribute('aria-invalid', 'true')
  },
}
