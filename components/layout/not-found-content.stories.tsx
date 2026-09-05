import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { NotFoundContent } from './not-found-content'

const meta = {
  component: NotFoundContent,
} satisfies Meta<typeof NotFoundContent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('404 Not Found')).toBeVisible()
    await expect(canvas.getByText('ここどこだワン...')).toBeVisible()
    await expect(canvas.getByRole('img', { name: '困っているよりあいぬ' })).toBeVisible()
  },
}
