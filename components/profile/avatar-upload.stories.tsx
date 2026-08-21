import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { MOCK_AVATAR_URL } from '@/lib/mocks/fixtures'
import { AvatarUpload } from './avatar-upload'

const meta = {
  component: AvatarUpload,
  parameters: {
    nextjs: { appDirectory: true },
  },
  args: {
    avatarUrl: null,
    onAvatarUrlChange: fn(),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof AvatarUpload>

export default meta
type Story = StoryObj<typeof meta>

function fileInput(canvasElement: HTMLElement) {
  const input = canvasElement.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('file input not found')
  return input
}

async function selectFile(canvasElement: HTMLElement, file: File) {
  const input = fileInput(canvasElement)
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  input.files = dataTransfer.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function dropFile(target: HTMLElement, file: File) {
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer }))
  target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }))
}

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'アイコン画像を選択' })).toBeVisible()
    await expect(canvas.queryByAltText('アイコン')).not.toBeInTheDocument()
  },
}

export const WithAvatar: Story = {
  args: { avatarUrl: MOCK_AVATAR_URL },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('アイコン')).toBeVisible()
  },
}

export const ValidationErrors: Story = {
  play: async ({ canvas, canvasElement }) => {
    await selectFile(canvasElement, new File(['plain'], 'notes.txt', { type: 'text/plain' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      '対応していない画像形式です（JPEG, PNG, WebP, GIFのいずれかを選択してください）',
    )
  },
}

export const Uploaded: Story = {
  play: async ({ args, canvasElement }) => {
    await selectFile(canvasElement, new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(args.onAvatarUrlChange).toHaveBeenCalledWith(MOCK_AVATAR_URL))
  },
}

export const Dropped: Story = {
  play: async ({ args, canvas }) => {
    await dropFile(
      canvas.getByRole('button', { name: 'アイコン画像を選択' }),
      new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' }),
    )
    await waitFor(() => expect(args.onAvatarUrlChange).toHaveBeenCalledWith(MOCK_AVATAR_URL))
  },
}

export const ServerError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.put('/api/users/me/avatar', () =>
          HttpResponse.json({ error: '画像のアップロードに失敗しました' }, { status: 502 }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await selectFile(canvasElement, new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' }))
    await expect(await screen.findByText('画像のアップロードに失敗しました')).toBeInTheDocument()
  },
}
