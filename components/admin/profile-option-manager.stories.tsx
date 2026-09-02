import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { ProfileOptionManager } from './profile-option-manager'

const meta = { component: ProfileOptionManager } satisfies Meta<typeof ProfileOptionManager>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: '所属部署' })).toBeVisible()
    await expect(await canvas.findByDisplayValue('開発部')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '開発部を上へ移動' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '営業部を上へ移動' })).toBeEnabled()
    await expect(canvas.getByRole('heading', { name: '興味' })).toBeVisible()
  },
}
