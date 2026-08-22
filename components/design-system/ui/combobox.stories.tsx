import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { Combobox } from './combobox'

const OPTIONS = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'prisma', label: 'Prisma' },
]

const meta = {
  component: Combobox,
  args: {
    options: OPTIONS,
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: 'タグを検索' },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('タグを検索')).toBeVisible()
  },
}

export const Filtering: Story = {
  args: { placeholder: 'タグを検索' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('タグを検索')
    await userEvent.click(input)
    await userEvent.type(input, 'Type')
    // ポップアップはPortalでdocument.body直下に描画されるためcanvasではなくbodyから検索する
    const body = within(document.body)
    await expect(await body.findByText('TypeScript')).toBeVisible()
    await expect(body.queryByText('Prisma')).not.toBeInTheDocument()
  },
}

export const SelectItem: Story = {
  args: { placeholder: 'タグを検索' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('タグを検索')
    await userEvent.click(input)
    const body = within(document.body)
    await userEvent.click(await body.findByText('Prisma'))
    await expect(input).toHaveValue('Prisma')
  },
}

export const NoMatch: Story = {
  args: { placeholder: 'タグを検索' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('タグを検索')
    await userEvent.click(input)
    await userEvent.type(input, '存在しない')
    const body = within(document.body)
    await expect(await body.findByText('一致する項目がありません')).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { placeholder: 'タグを検索', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('タグを検索')).toBeDisabled()
  },
}
