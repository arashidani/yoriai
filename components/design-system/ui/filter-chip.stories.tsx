import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { FilterChip } from './filter-chip'

const meta = {
  component: FilterChip,
  args: {
    children: '全て',
  },
} satisfies Meta<typeof FilterChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultPressed: false },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: '全て' })
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
  },
}

export const Selected: Story = {
  args: { defaultPressed: true },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: '全て' })
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Hover: Story = {
  args: { defaultPressed: false },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: '全て' })
    // jsdom/ヘッドレスブラウザではCSSの:hover疑似クラスが実反映されないため、
    // hover用ユーティリティクラスが付与されていることで代用検証する
    await expect(chip.className).toContain('hover:bg-statuschip-success')
  },
}
