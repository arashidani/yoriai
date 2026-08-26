import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { MentionTextarea } from './mention-textarea'

function MentionTextareaExample() {
  const [value, setValue] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  return (
    <MentionTextarea
      value={value}
      onChange={setValue}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      loadCandidates={async () => [
        { id: 'user-1', displayName: 'ねこ' },
        { id: 'user-2', displayName: 'いぬ' },
      ]}
      placeholder="回答を入力する"
    />
  )
}

const meta = {
  component: MentionTextareaExample,
} satisfies Meta<typeof MentionTextareaExample>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('combobox')
    await userEvent.type(textarea, '@')

    const listbox = await canvas.findByRole('listbox')
    await expect(textarea).toHaveAttribute('aria-expanded', 'true')
    await expect(textarea).toHaveAttribute('aria-controls', listbox.id)
    await expect(canvas.getByRole('option', { name: '@ねこ' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(textarea).toHaveValue('@いぬ ')
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument()
  },
}

export const TabSelectsCandidate: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('combobox')
    await userEvent.type(textarea, '@')
    await canvas.findByRole('listbox')

    await userEvent.keyboard('{Tab}')
    await expect(textarea).toHaveValue('@ねこ ')
  },
}

export const EscapeClosesList: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('combobox')
    await userEvent.type(textarea, '@')
    await canvas.findByRole('listbox')

    await userEvent.keyboard('{Escape}')
    await expect(textarea).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument()
  },
}
