import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  body: z.string().min(1, '本文は必須です'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
