import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, waitFor, within } from 'storybook/test'
import { StatusChipAction } from './status-chip-action'

const meta = {
  component: StatusChipAction,
  args: {
    status: 'OPEN',
    onEndRecruiting: fn(),
  },
} satisfies Meta<typeof StatusChipAction>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '募集を終了する' })
    await expect(button).toBeVisible()
    await expect(button.className).toContain('hover:bg-brand-2')
  },
}

export const Hover: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: '募集を終了する' })
    await userEvent.hover(button)
    // delay={0} で即座にマウントされるため、fade-in 完了まで待ってから可視性を検証する
    await waitFor(async () => {
      await expect(within(document.body).getByText('一度終了すると元に戻せません')).toBeVisible()
    })
  },
}

export const Clicked: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '募集を終了する' }))
    await expect(args.onEndRecruiting).toHaveBeenCalledTimes(1)
  },
}

export const Resolved: Story = {
  args: { status: 'RESOLVED' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('解決済み')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '募集を終了する' })).not.toBeInTheDocument()
  },
}
