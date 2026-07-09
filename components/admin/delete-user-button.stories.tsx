import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HttpResponse, http } from "msw";
import { expect, fn, screen } from "storybook/test";
import { DeleteUserButton } from "./delete-user-button";

const meta = {
  component: DeleteUserButton,
} satisfies Meta<typeof DeleteUserButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: "user-2",
    userName: "一般ユーザー",
    isSelf: false,
    onDeleted: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "ユーザーを削除" }));
    await userEvent.click(await screen.findByRole("button", { name: "削除する" }));
    await expect(await screen.findByText("ユーザーを削除しました")).toBeInTheDocument();
    await expect(args.onDeleted).toHaveBeenCalledWith("user-2");
  },
};

export const SelfCannotDelete: Story = {
  args: {
    userId: "user-1",
    userName: "管理者",
    isSelf: true,
    onDeleted: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "ユーザーを削除" })).toBeDisabled();
  },
};

export const DeleteFails: Story = {
  args: {
    userId: "user-2",
    userName: "一般ユーザー",
    isSelf: false,
    onDeleted: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.delete("/api/admin/users/:id", () =>
          HttpResponse.json({ error: "削除に失敗しました" }, { status: 400 }),
        ),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "ユーザーを削除" }));
    await userEvent.click(await screen.findByRole("button", { name: "削除する" }));
    await expect(await screen.findByText("削除に失敗しました")).toBeInTheDocument();
  },
};
