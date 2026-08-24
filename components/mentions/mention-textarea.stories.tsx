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
    await userEvent.type(canvas.getByRole('textbox'), '@')
    await expect(await canvas.findByRole('button', { name: '@ねこ' })).toBeVisible()
  },
}
