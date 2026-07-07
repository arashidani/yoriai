'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { createPostSchema, type CreatePostInput } from '@/lib/schemas/post'

type PostFormProps = {
  onSubmit: (data: CreatePostInput) => Promise<void>
  isSubmitting?: boolean
}

export function PostForm({ onSubmit, isSubmitting = false }: PostFormProps) {
  const { control, handleSubmit } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', body: '' },
  })

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="タイトル"
            placeholder="質問のタイトルを入力してください"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />
      <Controller
        name="body"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="本文"
            placeholder="質問の詳細を入力してください"
            multiline
            minRows={8}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: 'flex-start' }}>
        {isSubmitting ? '送信中...' : '投稿する'}
      </Button>
    </Box>
  )
}
