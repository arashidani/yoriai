import { z } from 'zod'

export const COMPANY_EMAIL_DOMAIN = 'ibjapan.jp'
export const COMPANY_EMAIL_ERROR = `${COMPANY_EMAIL_DOMAIN}ドメインのメールアドレスを入力してください`

export const companyEmailSchema = z
  .string()
  .min(1, 'メールアドレスを入力してください')
  .pipe(z.email({ error: '有効なメールアドレスを入力してください' }))
  .refine((email) => email.toLowerCase().endsWith(`@${COMPANY_EMAIL_DOMAIN}`), {
    message: COMPANY_EMAIL_ERROR,
  })

export const registerFormSchema = z.object({
  name: z.string().min(1, '表示名を入力してください').max(100),
  email: companyEmailSchema,
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^[a-zA-Z0-9]+$/, { message: 'パスワードは半角英数字で入力してください' })
    .regex(/[a-zA-Z]/, { message: 'パスワードは半角英字を含めてください' })
    .regex(/[0-9]/, { message: 'パスワードは半角数字を含めてください' }),
})

export type RegisterFormInput = z.infer<typeof registerFormSchema>
