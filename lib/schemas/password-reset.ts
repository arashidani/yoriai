import { z } from 'zod'

export const completePasswordResetSchema = z.object({
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export type CompletePasswordResetInput = z.infer<typeof completePasswordResetSchema>
