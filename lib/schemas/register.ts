import { z } from 'zod'

export const registerFormSchema = z.object({
  name: z.string().min(1, '表示名を入力してください').max(100),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export type RegisterFormInput = z.infer<typeof registerFormSchema>
