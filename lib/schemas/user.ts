import { z } from 'zod'
import { Role } from '@/app/generated/prisma/enums'

export const createUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  inviteToken: z.string().min(1, '招待リンクが必要です'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(1, '名前を入力してください').optional(),
  role: z.nativeEnum(Role).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
