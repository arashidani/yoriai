import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Button } from './button'

const meta = {
  component: Button,
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'ボタン',
    variant: 'primary',
    size: 'extraLarge',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeEnabled()
  },
}

export const Secondary: Story = {
  args: {
    children: 'ボタン',
    variant: 'secondary',
    size: 'extraLarge',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeVisible()
  },
}

export const Disabled: Story = {
  args: {
    children: 'ボタン',
    variant: 'primary',
    size: 'extraLarge',
    isDisabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeDisabled()
  },
}

export const LongLabel: Story = {
  args: {
    children: 'プロフィール設定に進む',
    variant: 'primary',
    size: 'extraLarge',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'プロフィール設定に進む' })).toBeVisible()
  },
}

export const Large: Story = {
  args: {
    children: 'ボタン',
    variant: 'primary',
    size: 'large',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeVisible()
  },
}

export const Default: Story = {
  args: {
    children: 'ボタン',
    variant: 'primary',
    size: 'default',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeVisible()
  },
}

export const Ghost: Story = {
  args: {
    children: 'ボタン',
    variant: 'ghost',
    size: 'large',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeVisible()
  },
}

export const GhostDefault: Story = {
  args: {
    children: 'ボタン',
    variant: 'ghost',
    size: 'default',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeVisible()
  },
}

export const SecondaryDisabled: Story = {
  args: {
    children: 'ボタン',
    variant: 'secondary',
    isDisabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'ボタン' })).toBeDisabled()
  },
}
