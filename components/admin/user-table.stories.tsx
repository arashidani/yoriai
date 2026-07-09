import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { UserTable } from "./user-table";

const meta = {
  component: UserTable,
} satisfies Meta<typeof UserTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const users = [
  {
    id: "user-1",
    email: "admin@example.com",
    name: "管理者",
    role: "ADMIN" as const,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-2",
    email: "user@example.com",
    name: "一般ユーザー",
    role: "USER" as const,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

export const Default: Story = {
  args: { users, currentUserId: "user-1" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("管理者")).toBeVisible();
    await expect(canvas.getByText("ADMIN")).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "ユーザーを編集" })).toHaveLength(2);
    await expect(canvas.getAllByRole("button", { name: "ユーザーを削除" })).toHaveLength(2);
  },
};

export const SelfRowDisablesDelete: Story = {
  args: { users, currentUserId: "user-1" },
  play: async ({ canvas }) => {
    const deleteButtons = canvas.getAllByRole("button", { name: "ユーザーを削除" });
    await expect(deleteButtons[0]).toBeDisabled();
    await expect(deleteButtons[1]).toBeEnabled();
  },
};

export const Empty: Story = {
  args: { users: [], currentUserId: "user-1" },
};

export const NoName: Story = {
  args: {
    users: [
      {
        id: "user-3",
        email: "noname@example.com",
        name: null,
        role: "USER" as const,
        createdAt: "2024-01-03T00:00:00Z",
      },
    ],
    currentUserId: "user-1",
  },
};
