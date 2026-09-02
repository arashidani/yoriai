import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { ActionButtons } from './action-buttons'

const meta = {
  component: ActionButtons,
  parameters: {
    nextjs: { appDirectory: true },
  },
  args: {
    primaryLabel: '質問する',
    onPrimaryClick: fn(),
    secondaryLabel: 'Q&A管理',
    onSecondaryClick: fn(),
  },
} satisfies Meta<typeof ActionButtons>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
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

export const ClickSecondary: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Q&A管理' }))
    await expect(args.onSecondaryClick).toHaveBeenCalled()
  },
}

export const SecondaryLink: Story = {
  args: {
    secondaryHref: '/my-questions',
    onSecondaryClick: undefined,
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Q&A管理' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/my-questions')
  },
}
