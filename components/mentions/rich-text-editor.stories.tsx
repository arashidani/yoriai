import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { RichTextEditor } from './rich-text-editor'

function RichTextEditorExample({
  onSubmit,
  withMentions = false,
}: {
  onSubmit?: () => void
  withMentions?: boolean
}) {
  const [value, setValue] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      placeholder="本文を入力する"
      ariaLabel="本文"
      mentions={
        withMentions
          ? {
              selectedIds,
              onSelectedIdsChange: setSelectedIds,
              loadCandidates: async () => [
                { id: 'user-1', displayName: 'ねこ' },
                { id: 'user-2', displayName: 'いぬ' },
              ],
            }
          : undefined
      }
    />
  )
}

const meta = {
  component: RichTextEditorExample,
} satisfies Meta<typeof RichTextEditorExample>

export default meta
type Story = StoryObj<typeof meta>

async function readyEditor(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  name = '本文',
) {
  await waitFor(() => {
    expect(canvas.getByRole('textbox', { name })).toHaveAttribute('contenteditable', 'true')
  })
  return canvas.getByRole('textbox', { name })
}

export const Default: Story = {
  play: async ({ canvas }) => {
    await readyEditor(canvas)
    await expect(canvas.getByRole('button', { name: '太字' })).toBeVisible()
  },
}

export const Typing: Story = {
  play: async ({ canvas }) => {
    const editor = await readyEditor(canvas)
    await userEvent.click(editor)
    await userEvent.type(editor, 'こんにちは')
    await expect(editor).toHaveTextContent('こんにちは')
  },
}

export const Bold: Story = {
  play: async ({ canvas }) => {
    const editor = await readyEditor(canvas)
    await userEvent.click(editor)
    await userEvent.type(editor, '太字')
    await userEvent.keyboard('{Control>}a{/Control}')
    await userEvent.click(canvas.getByRole('button', { name: '太字' }))
    await expect(canvas.getByRole('button', { name: '太字' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const Mentions: Story = {
  args: { withMentions: true },
  play: async ({ canvas }) => {
    await waitFor(() => {
      expect(canvas.getByRole('combobox', { name: '本文' })).toHaveAttribute(
        'contenteditable',
        'true',
      )
    })
    const editor = canvas.getByRole('combobox', { name: '本文' })
    const body = within(document.body)
    await userEvent.click(editor)
    await userEvent.type(editor, '@')
    const listbox = await body.findByRole('listbox')
    await expect(body.getByRole('option', { name: '@ねこ' })).toBeVisible()
    await expect(listbox).toBeVisible()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(editor).toHaveTextContent('@いぬ')
    await waitFor(() => {
      expect(body.queryByRole('listbox')).toBeNull()
    })

    await userEvent.type(editor, '@')
    await expect(body.getByRole('listbox')).toBeVisible()
    await userEvent.click(body.getByRole('option', { name: '@ねこ' }))
    await expect(editor).toHaveTextContent('@いぬ @ねこ')
    await waitFor(() => {
      expect(body.queryByRole('listbox')).toBeNull()
    })

    await userEvent.click(canvas.getByRole('button', { name: 'メンション' }))
    await expect(body.getByRole('listbox')).toBeVisible()
  },
}

export const ModEnterSubmits: Story = {
  args: { onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const editor = await readyEditor(canvas)
    await userEvent.click(editor)
    await userEvent.type(editor, 'hello')
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    await expect(args.onSubmit).toHaveBeenCalled()
  },
}
