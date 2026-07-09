import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen } from 'storybook/test'
import { Role } from '@/app/generated/prisma/enums'
import { EditUserDialog } from './edit-user-dialog'

const meta = {
  component: EditUserDialog,
} satisfies Meta<typeof EditUserDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userId: 'user-2',
    initialName: '一般ユーザー',
    initialRole: Role.USER,
    isSelf: false,
    onUpdated: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ユーザーを編集' }))
    const nameInput = await screen.findByLabelText('名前')
    await expect(nameInput).toHaveValue('一般ユーザー')
    await expect(screen.getByRole('switch', { name: '管理者権限' })).not.toBeChecked()
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, '新しい名前')
    await userEvent.click(screen.getByRole('button', { name: '保存する' }))
    await expect(await screen.findByText('ユーザー情報を更新しました')).toBeInTheDocument()
  },
}

export const SelfCannotChangeRole: Story = {
  args: {
    userId: 'user-1',
    initialName: '管理者',
    initialRole: Role.ADMIN,
    isSelf: true,
    onUpdated: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ユーザーを編集' }))
    await expect(screen.getByRole('switch', { name: '管理者権限' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

export const EmptyNameShowsValidationError: Story = {
  args: {
    userId: 'user-2',
    initialName: '一般ユーザー',
    initialRole: Role.USER,
    isSelf: false,
    onUpdated: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ユーザーを編集' }))
    const nameInput = await screen.findByLabelText('名前')
    await userEvent.clear(nameInput)
    await userEvent.click(screen.getByRole('button', { name: '保存する' }))
    await expect(await screen.findByText('名前を入力してください')).toBeInTheDocument()
  },
}

export const UpdateFails: Story = {
  args: {
    userId: 'user-2',
    initialName: '一般ユーザー',
    initialRole: Role.USER,
    isSelf: false,
    onUpdated: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.patch('/api/admin/users/:id', () =>
          HttpResponse.json({ error: '更新に失敗しました' }, { status: 400 }),
        ),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'ユーザーを編集' }))
    await userEvent.click(await screen.findByRole('button', { name: '保存する' }))
    await expect(await screen.findByText('更新に失敗しました')).toBeInTheDocument()
  },
}
