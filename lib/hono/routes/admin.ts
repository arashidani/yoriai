import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { Role } from "@/app/generated/prisma/enums";
import { authMiddleware } from "@/lib/hono/middleware/auth";
import { MOCK_POSTS, MOCK_USERS } from "@/lib/mocks/fixtures";
import { prisma } from "@/lib/prisma/client";
import { updateUserSchema } from "@/lib/schemas/user";

export const adminRoute = new Hono()
  .use(authMiddleware)
  .use(async (c, next) => {
    const user = c.get("user");
    if (user.role !== Role.ADMIN) return c.json({ error: "Forbidden" }, 403);
    return next();
  })
  .get("/users", async (c) => {
    if (process.env.MOCK_MODE === "true") {
      return c.json({ users: MOCK_USERS });
    }
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return c.json({ users });
  })
  .get("/posts", async (c) => {
    if (process.env.MOCK_MODE === "true") {
      return c.json({ posts: MOCK_POSTS });
    }
    const posts = await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
    return c.json({ posts });
  })
  .patch("/users/:id", zValidator("json", updateUserSchema), async (c) => {
    const currentUser = c.get("user");
    const targetId = c.req.param("id");
    const { name, role } = c.req.valid("json");

    if (targetId === currentUser.id && role !== undefined) {
      return c.json({ error: "自分自身のロールは変更できません" }, 400);
    }

    if (process.env.MOCK_MODE === "true") {
      return c.json({ success: true });
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { ...(name !== undefined && { name }), ...(role !== undefined && { role }) },
    });
    return c.json({ user });
  })
  .delete("/users/:id", async (c) => {
    const currentUser = c.get("user");
    const targetId = c.req.param("id");

    if (targetId === currentUser.id) {
      return c.json({ error: "自分自身は削除できません" }, 400);
    }

    if (process.env.MOCK_MODE === "true") {
      return c.json({ success: true });
    }

    await prisma.user.delete({ where: { id: targetId } });
    return c.json({ success: true });
  });
