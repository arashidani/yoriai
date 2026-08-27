import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .pipe(z.email({ error: '有効なメールアドレスを入力してください' })),
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type LoginFormInput = z.infer<typeof loginFormSchema>
