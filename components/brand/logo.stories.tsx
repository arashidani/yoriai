import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Logo } from './logo'

const meta = {
  component: Logo,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { className: 'h-12 w-auto' },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('Yoriai')).toBeVisible()
  },
}

export const Full: Story = {
  args: { variant: 'full', className: 'h-12 w-auto' },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('Yoriai')).toBeVisible()
  },
}

export const Mark: Story = {
  args: { variant: 'mark', className: 'h-12 w-auto' },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('Yoriai')).toBeVisible()
  },
}

export const CustomAlt: Story = {
  args: { variant: 'full', alt: 'Yoriai ホーム', className: 'h-12 w-auto' },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('Yoriai ホーム')).toBeVisible()
  },
}
