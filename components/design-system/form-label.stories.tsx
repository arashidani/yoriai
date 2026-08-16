import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { FormLabel } from './form-label'

const meta = {
  component: FormLabel,
} satisfies Meta<typeof FormLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'ニックネーム' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ニックネーム')).toBeVisible()
    await expect(canvas.queryByText('必須')).toBeNull()
  },
}

export const Required: Story = {
  args: { label: 'ニックネーム', isRequired: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('必須')).toBeVisible()
  },
}

export const WithInfoIcon: Story = {
  args: { label: '入社年月', isInfoIcon: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toBeVisible()
  },
}
