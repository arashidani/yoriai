import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { FormTitleMultiSelect } from './form-title-multi-select'

const meta = {
  component: FormTitleMultiSelect,
} satisfies Meta<typeof FormTitleMultiSelect>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { id: 'skill-1', name: 'マーケティング' },
  { id: 'skill-2', name: '営業' },
]

export const Default: Story = {
  args: {
    label: 'ビジネススキル',
    options,
    selectedIds: [],
    onToggle: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ビジネススキル')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'マーケティング' })).toBeVisible()
  },
}

export const Required: Story = {
  args: {
    label: 'ビジネススキル',
    isRequired: true,
    options,
    selectedIds: [],
    onToggle: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('必須')).toBeVisible()
  },
}

export const Toggle: Story = {
  args: {
    label: 'ビジネススキル',
    options,
    selectedIds: ['skill-1'],
    onToggle: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '営業' }))
    await expect(args.onToggle).toHaveBeenCalledWith('skill-2')
  },
}
