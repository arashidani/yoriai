import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { HeaderSection } from './header-section'

const meta = {
  component: HeaderSection,
  args: {
    title: 'なんでもQ&A',
    primaryLabel: '質問する',
    onPrimaryClick: fn(),
    secondaryLabel: 'Q&A管理',
    onSecondaryClick: fn(),
  },
} satisfies Meta<typeof HeaderSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'なんでもQ&A' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /質問する/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Q&A管理' })).toBeVisible()
  },
}

export const ClickPrimary: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /質問する/ }))
    await expect(args.onPrimaryClick).toHaveBeenCalled()
  },
}
