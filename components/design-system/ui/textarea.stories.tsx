import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent } from 'storybook/test'
import { Textarea } from './textarea'

const meta = {
  component: Textarea,
  args: {
    placeholder: 'Type your message here.',
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('Type your message here.')).toBeVisible()
  },
}

export const Value: Story = {
  args: { defaultValue: 'Value' },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('Value')).toBeVisible()
  },
}

export const Typing: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByPlaceholderText('Type your message here.')
    await userEvent.type(textarea, 'こんにちは')
    await expect(textarea).toHaveValue('こんにちは')
  },
}

export const Invalid: Story = {
  args: { defaultValue: 'Value', 'aria-invalid': true },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('Value')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Disabled: Story = {
  args: { defaultValue: 'Value', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('Value')).toBeDisabled()
  },
}

export const Round: Story = {
  args: { roundness: 'round', defaultValue: 'Value' },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('Value')).toBeVisible()
  },
}
