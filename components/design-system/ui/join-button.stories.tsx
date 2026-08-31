import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { JoinButton } from './join-button'

const meta = {
  component: JoinButton,
} satisfies Meta<typeof JoinButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultPressed: false },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '参加する' })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  },
}

export const Active: Story = {
  args: { defaultPressed: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '参加中' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Disabled: Story = {
  args: { defaultPressed: false, disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '参加する' })).toBeDisabled()
  },
}

export const Hover: Story = {
  args: { defaultPressed: false },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '参加する' })
    // ヘッドレスブラウザではCSSの:hover疑似クラスが実反映されないため、
    // hover用ユーティリティクラスが付与されていることで代用検証する
    await expect(button.className).toContain('not-aria-pressed:hover:bg-brand-2')
  },
}
