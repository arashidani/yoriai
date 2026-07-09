import { Role } from "@/app/generated/prisma/enums";

export const MOCK_USERS = [
  {
    id: "user-1",
    supabaseId: "supabase-user-1",
    email: "dev@example.com",
    name: "開発者",
    role: Role.ADMIN,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    supabaseId: "supabase-user-2",
    email: "user@example.com",
    name: "一般ユーザー",
    role: Role.USER,
    createdAt: new Date("2024-01-02"),
  },
];

export const MOCK_POSTS = [
  {
    id: "post-1",
    title: "Next.js App Routerの使い方を教えてください",
    body: "App RouterとPages Routerの違いが分からなくて困っています。どちらを使うべきでしょうか？",
    authorId: "user-2",
    author: MOCK_USERS[1],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "post-2",
    title: "TypeScriptの型エラーを解決したい",
    body: "`Type string is not assignable to type number` というエラーが出て困っています。",
    authorId: "user-1",
    author: MOCK_USERS[0],
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-11"),
  },
  {
    id: "post-3",
    title: "Prismaでリレーションを使う方法",
    body: "1対多のリレーションをPrismaで定義する方法を知りたいです。",
    authorId: "user-2",
    author: MOCK_USERS[1],
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "post-4",
    title: "Next.jsのエラーを解決したい",
    body: "`Error: Invalid hook call. Hooks can only be called inside of the body of a function component.` というエラーが出て困っています。",
    authorId: "user-1",
    author: MOCK_USERS[0],
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
  },
];
