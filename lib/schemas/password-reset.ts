import { z } from 'zod'

export const completePasswordResetSchema = z.object({
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export type CompletePasswordResetInput = z.infer<typeof completePasswordResetSchema>

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
    confirmPassword: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>
