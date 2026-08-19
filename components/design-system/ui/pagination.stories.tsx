import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import { Pagination } from './pagination'

const meta = {
  component: Pagination,
  args: {
    page: 2,
    totalPages: 10,
    onPageChange: fn(),
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('button', { name: '10' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '5' })).not.toBeInTheDocument()
  },
}

export const FirstPage: Story = {
  args: { page: 1 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '前へ' })).toBeDisabled()
  },
}

export const LastPage: Story = {
  args: { page: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '次へ' })).toBeDisabled()
  },
}

export const FewPages: Story = {
  args: { page: 1, totalPages: 3 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '1' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '2' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '3' })).toBeVisible()
  },
}

export const ClickPage: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '3' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(3)
  },
}

function InteractiveDemo() {
  const [page, setPage] = useState(2)
  return <Pagination page={page} totalPages={10} onPageChange={setPage} />
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '次へ' }))
    await expect(canvas.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page')
  },
}
