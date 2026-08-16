import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { QaPagination } from './qa-pagination'

const meta = {
  component: QaPagination,
} satisfies Meta<typeof QaPagination>

export default meta
type Story = StoryObj<typeof meta>

const baseArgs = {
  pageSize: 10,
  disabled: false,
  onPageChange: fn(),
}

export const Start: Story = {
  args: {
    ...baseArgs,
    page: 1,
    totalPages: 10,
    total: 100,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'ページ送り' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('button', { name: '2' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '3' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '4' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '10' })).toBeVisible()
    await expect(canvas.getByText('100件中 1~10件を表示')).toBeVisible()
  },
}

export const Middle: Story = {
  args: {
    ...baseArgs,
    page: 5,
    totalPages: 10,
    total: 100,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '1' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '4' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '5' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('button', { name: '6' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '10' })).toBeVisible()
    await expect(canvas.getByText('100件中 41~50件を表示')).toBeVisible()
  },
}

export const End: Story = {
  args: {
    ...baseArgs,
    page: 10,
    totalPages: 10,
    total: 100,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '7' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '8' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '9' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '10' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByText('100件中 91~100件を表示')).toBeVisible()
  },
}

export const AllPages: Story = {
  args: {
    ...baseArgs,
    page: 3,
    totalPages: 7,
    total: 70,
  },
  play: async ({ canvas }) => {
    for (let page = 1; page <= 7; page += 1) {
      await expect(canvas.getByRole('button', { name: String(page) })).toBeVisible()
    }
    await expect(canvas.queryByText('…')).not.toBeInTheDocument()
  },
}

export const SinglePage: Story = {
  args: {
    ...baseArgs,
    page: 1,
    totalPages: 1,
    total: 4,
    pageSize: 10,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation', { name: 'ページ送り' })).not.toBeInTheDocument()
    await expect(canvas.getByText('4件中 1~4件を表示')).toBeVisible()
  },
}

export const Empty: Story = {
  args: {
    ...baseArgs,
    page: 1,
    totalPages: 0,
    total: 0,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation', { name: 'ページ送り' })).not.toBeInTheDocument()
    await expect(canvas.queryByText(/件中/)).not.toBeInTheDocument()
  },
}

export const PartialLastPage: Story = {
  args: {
    ...baseArgs,
    page: 10,
    totalPages: 10,
    total: 97,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('97件中 91~97件を表示')).toBeVisible()
  },
}

export const PageChange: Story = {
  args: {
    ...baseArgs,
    page: 5,
    totalPages: 10,
    total: 100,
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '6' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(6)
    await expect(args.onPageChange).toHaveBeenCalledTimes(1)

    await userEvent.click(canvas.getByRole('button', { name: '5' }))
    await expect(args.onPageChange).toHaveBeenCalledTimes(1)
  },
}
