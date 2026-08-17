import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FormTitleSelect } from './form-title-select'

const meta = {
  component: FormTitleSelect,
} satisfies Meta<typeof FormTitleSelect>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { id: 'department-1', name: '開発部' },
  { id: 'department-2', name: '営業部' },
]

export const Default: Story = {
  args: {
    id: 'department',
    label: '所属部署',
    options,
    value: '',
    onValueChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('所属部署')).toBeVisible()
    await expect(canvas.getByText('選択してください')).toBeVisible()
  },
}

export const WithError: Story = {
  args: {
    id: 'department',
    label: '所属部署',
    options,
    value: '',
    onValueChange: fn(),
    error: '所属部署を選択してください',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('所属部署')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const SelectOption: Story = {
  args: {
    id: 'department',
    label: '所属部署',
    options,
    value: '',
    onValueChange: fn(),
  },
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByLabelText('所属部署')
    await userEvent.click(trigger)
    await userEvent.click(await within(document.body).findByRole('option', { name: '開発部' }))
    await expect(args.onValueChange).toHaveBeenCalledWith('department-1')
  },
}
