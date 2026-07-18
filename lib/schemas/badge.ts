import { z } from 'zod'
import { BadgeRarity } from '@/app/generated/prisma/enums'

export const createBadgeSchema = z.object({
  name: z.string().min(1, 'バッジ名を入力してください').max(100),
  description: z.string().min(1, '説明を入力してください').max(300),
  icon: z.string().min(1),
  rarity: z.nativeEnum(BadgeRarity),
})

export type CreateBadgeInput = z.infer<typeof createBadgeSchema>
