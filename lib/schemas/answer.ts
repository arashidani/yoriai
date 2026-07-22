import { z } from 'zod'

export const createAnswerSchema = z.object({
  body: z.string().min(1, '本文は必須です'),
})

export type CreateAnswerInput = z.infer<typeof createAnswerSchema>
