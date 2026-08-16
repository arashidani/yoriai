import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { SelectCategories } from './select-categories'

const categories = [
  { id: 'pregnancy', name: '妊活' },
  { id: 'infertility', name: '不妊治療' },
  { id: 'childcare', name: '育児' },
]

const meta = {
  component: SelectCategories,
  args: {
    categories,
  },
} satisfies Meta<typeof SelectCategories>

export default meta
type Story = StoryObj<typeof meta>

export const Placeholder: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('カテゴリーを選択')).toBeVisible()
  },
}

export const SelectOption: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: '妊活' }))
    await expect(canvas.getByText('妊活')).toBeVisible()
  },
}
