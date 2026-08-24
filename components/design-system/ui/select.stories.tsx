import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Select } from './select'

const OPTIONS = [
  { value: 'attendance', label: '勤怠・有給関連' },
  { value: 'expense', label: '経費精算' },
  { value: 'other', label: 'その他' },
]

const meta = {
  component: Select,
  args: {
    options: OPTIONS,
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Placeholder: Story = {
  args: { placeholder: 'カテゴリーを選択' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('カテゴリーを選択')).toBeVisible()
  },
}

export const WithValue: Story = {
  args: { placeholder: 'カテゴリーを選択', defaultValue: 'attendance' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('勤怠・有給関連')).toBeVisible()
  },
}

export const ErrorState: Story = {
  args: { placeholder: 'カテゴリーを選択', 'aria-invalid': true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Disabled: Story = {
  args: { placeholder: 'カテゴリーを選択', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toBeDisabled()
  },
}
