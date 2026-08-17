import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { FormTitle } from './form-title'

const meta = {
  component: FormTitle,
} satisfies Meta<typeof FormTitle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'あなたについて教えてください',
    description: 'プロフィールの入力をお願いします',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('あなたについて教えてください')).toBeVisible()
    await expect(canvas.getByText('プロフィールの入力をお願いします')).toBeVisible()
  },
}
