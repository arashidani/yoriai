import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent } from 'storybook/test'
import { Button } from '@/components/design-system/button'
import { IconImg } from '@/components/design-system/icons/icon-img'
import { IconSend } from '@/components/design-system/icons/icon-send'
import { TextareaWithActions } from './textarea'

const meta = {
  component: TextareaWithActions,
  args: {
    placeholder: '今の気分をシェアしましょう',
    leadingActions: (
      <button
        type="button"
        aria-label="画像を添付"
        className="flex size-10 items-center justify-center rounded-full border-2 border-border-3 bg-primary-foreground transition-colors hover:bg-secondary-hover"
      >
        <IconImg className="size-[17px] text-foreground" />
      </button>
    ),
    actions: (
      <Button variant="primary" size="default" leftIcon={<IconSend className="size-4" />}>
        送信
      </Button>
    ),
  },
} satisfies Meta<typeof TextareaWithActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('今の気分をシェアしましょう')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '画像を添付' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '送信' })).toBeVisible()
  },
}

export const Typing: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByPlaceholderText('今の気分をシェアしましょう')
    await userEvent.type(textarea, 'こんにちは')
    await expect(textarea).toHaveValue('こんにちは')
  },
}

export const WithPreview: Story = {
  args: {
    defaultValue: '昨日餃子食べてビール飲んで寝ました！',
    children: (
      <div className="px-4 pt-2">
        <div className="h-40 w-full rounded-lg bg-muted" />
      </div>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('昨日餃子食べてビール飲んで寝ました！')).toBeVisible()
  },
}

export const Round: Story = {
  args: { roundness: 'round' },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('今の気分をシェアしましょう')).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { defaultValue: '送信中…', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('送信中…')).toBeDisabled()
  },
}
