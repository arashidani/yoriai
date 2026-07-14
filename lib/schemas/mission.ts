import { z } from 'zod'

export const createMissionSchema = z.object({
  name: z.string().min(1, 'ミッション名を入力してください').max(100),
  description: z.string().min(1, '説明を入力してください').max(300),
  durationLabel: z.string().min(1),
  targetCount: z.number().int().min(1, '達成条件は1以上で入力してください'),
  rewardBadgeId: z.string().nullable().optional(),
})

export type CreateMissionInput = z.infer<typeof createMissionSchema>
