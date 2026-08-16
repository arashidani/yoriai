import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { RadioButton } from './radio-button'

const meta = {
  component: RadioButton,
} satisfies Meta<typeof RadioButton>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: 'yes', label: '好き' },
  { value: 'no', label: '苦手' },
]

export const Default: Story = {
  args: {
    name: 'lunch-preference',
    options,
    value: 'yes',
    onValueChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: '好き' })).toBeChecked()
    await expect(canvas.getByRole('radio', { name: '苦手' })).not.toBeChecked()
  },
}

export const Select: Story = {
  args: {
    name: 'lunch-preference',
    options,
    value: 'yes',
    onValueChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('radio', { name: '苦手' }))
    await expect(args.onValueChange).toHaveBeenCalledWith('no', expect.anything())
  },
}
