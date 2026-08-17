import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { FormTitleRadioButton } from './form-title-radio-button'

const meta = {
  component: FormTitleRadioButton,
} satisfies Meta<typeof FormTitleRadioButton>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: 'yes', label: '好き' },
  { value: 'no', label: '苦手' },
]

export const Default: Story = {
  args: {
    name: 'lunch-preference',
    label: 'ランチの好み',
    options,
    value: 'yes',
    onValueChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ランチの好み')).toBeVisible()
    await expect(canvas.getByRole('radio', { name: '好き' })).toBeChecked()
  },
}

export const Required: Story = {
  args: {
    name: 'lunch-preference',
    label: 'ランチの好み',
    isRequired: true,
    options,
    value: '',
    onValueChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('必須')).toBeVisible()
  },
}

export const Select: Story = {
  args: {
    name: 'lunch-preference',
    label: 'ランチの好み',
    options,
    value: 'yes',
    onValueChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('radio', { name: '苦手' }))
    await expect(args.onValueChange).toHaveBeenCalledWith('no', expect.anything())
  },
}
