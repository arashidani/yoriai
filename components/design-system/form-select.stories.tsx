import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FormSelect } from './form-select'

const meta = {
  component: FormSelect,
} satisfies Meta<typeof FormSelect>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { id: 'department-1', name: '開発部' },
  { id: 'department-2', name: '営業部' },
]

export const Default: Story = {
  args: {
    id: 'department',
    options,
    value: '',
    onValueChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('選択してください')).toBeVisible()
  },
}

export const Selected: Story = {
  args: {
    id: 'department',
    options,
    value: 'department-1',
    onValueChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('開発部')).toBeVisible()
  },
}

export const WithError: Story = {
  args: {
    id: 'department',
    options,
    value: '',
    onValueChange: fn(),
    error: '所属部署を選択してください',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const SelectOption: Story = {
  args: {
    id: 'department',
    options,
    value: '',
    onValueChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await within(document.body).findByRole('option', { name: '営業部' }))
    await expect(args.onValueChange).toHaveBeenCalledWith('department-2')
  },
}
