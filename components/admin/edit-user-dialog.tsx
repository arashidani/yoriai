"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Role } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { client } from "@/lib/hono/client";
import { type UpdateUserInput, updateUserSchema } from "@/lib/schemas/user";

type EditUserDialogProps = {
  userId: string;
  initialName: string | null;
  initialRole: Role;
  isSelf: boolean;
  onUpdated: (user: { name: string | null; role: Role }) => void;
};

export function EditUserDialog({
  userId,
  initialName,
  initialRole,
  isSelf,
  onUpdated,
}: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(initialRole);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: initialName ?? "" },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setRole(initialRole);
      reset({ name: initialName ?? "" });
    }
  }

  async function onSubmit(data: UpdateUserInput) {
    const res = await client.api.admin.users[":id"].$patch({
      param: { id: userId },
      json: { name: data.name, role },
    });

    if (!res.ok) {
      const body = await res.json();
      const message =
        "error" in body && typeof body.error === "string" ? body.error : "更新に失敗しました";
      toast.error(message);
      return;
    }

    setOpen(false);
    onUpdated({ name: data.name ?? null, role });
    toast.success("ユーザー情報を更新しました");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="ユーザーを編集">
            <Pencil />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ユーザーを編集</DialogTitle>
          <DialogDescription>名前と管理者権限を変更できます。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="role">管理者権限</Label>
            <Switch
              id="role"
              checked={role === Role.ADMIN}
              disabled={isSelf}
              onCheckedChange={(checked) => setRole(checked ? Role.ADMIN : Role.USER)}
              aria-label="管理者権限"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
