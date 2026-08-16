import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent } from 'storybook/test'
import { KeywordInput } from './keyword-input'

const meta = {
  component: KeywordInput,
} satisfies Meta<typeof KeywordInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('キーワードを入力')).toBeVisible()
  },
}

export const Typing: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByPlaceholderText('キーワードを入力')
    await userEvent.type(input, '妊活')
    await expect(input).toHaveValue('妊活')
  },
}
