import { z } from 'zod'
import { Role } from '@/app/generated/prisma/enums'

export const createInviteSchema = z.object({
  name: z.string().min(1, '名前（仮）を入力してください').max(100),
  role: z.nativeEnum(Role),
})

export type CreateInviteInput = z.infer<typeof createInviteSchema>
