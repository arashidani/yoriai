import { z } from 'zod'

const chatMessagePartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(chatMessagePartSchema).min(1),
})

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'メッセージが空です'),
  conversationId: z.string().optional(),
})

export type ChatRequestInput = z.infer<typeof chatRequestSchema>
