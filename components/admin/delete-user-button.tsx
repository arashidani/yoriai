'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/hono/client';

type DeleteUserButtonProps = {
  userId: string;
  userName: string | null;
  isSelf: boolean;
  onDeleted: (userId: string) => void;
};

export function DeleteUserButton({ userId, userName, isSelf, onDeleted }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const res = await client.api.admin.users[':id'].$delete({
      param: { id: userId },
    });
    setPending(false);
    setOpen(false);

    if (!res.ok) {
      const body = await res.json();
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '削除に失敗しました';
      toast.error(message);
      return;
    }
    onDeleted(userId);
    toast.success('ユーザーを削除しました');
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" disabled={isSelf} aria-label="ユーザーを削除">
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {userName ?? 'このユーザー'}を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
