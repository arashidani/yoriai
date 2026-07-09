import { z } from "zod";
import { Role } from "@/app/generated/prisma/enums";

export const updateUserSchema = z.object({
  name: z.string().min(1, "名前を入力してください").optional(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
