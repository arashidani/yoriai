import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { StatusChipAction } from './status-chip-action'

const meta = {
  component: StatusChipAction,
} satisfies Meta<typeof StatusChipAction>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: { status: 'OPEN', onEndRecruiting: fn() },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '募集を終了する' })
    await expect(button).toBeVisible()
  },
}

export const Hover: Story = {
  args: { status: 'OPEN', onEndRecruiting: fn() },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '募集を終了する' })
    await userEvent.hover(button)
    await expect(
      await within(document.body).findByText('一度終了すると元に戻せません'),
    ).toBeVisible()
  },
}

export const Clicked: Story = {
  args: { status: 'OPEN', onEndRecruiting: fn() },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: '募集を終了する' })
    await userEvent.click(button)
    await expect(args.onEndRecruiting).toHaveBeenCalledTimes(1)
  },
}

export const Resolved: Story = {
  args: { status: 'RESOLVED' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('解決済み')).toBeVisible()
  },
}
