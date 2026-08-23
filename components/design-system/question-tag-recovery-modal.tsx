'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/design-system/button'
import { SelectCategories } from '@/components/design-system/ui/select-categories'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

type QuestionTagRecoveryModalProps = {
  tagCategories: {
    id: string
    name: string
    tags: { id: string; name: string }[]
  }[]
  onRetry: () => Promise<void>
  onAssignManually: (tagId: string) => Promise<void>
}

export function QuestionTagRecoveryModal({
  tagCategories,
  onRetry,
  onAssignManually,
}: QuestionTagRecoveryModalProps) {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'ai' | 'manual' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tagOptions = tagCategories.flatMap(({ tags }) => tags)

  async function run(action: 'ai' | 'manual') {
    if (pendingAction || (action === 'manual' && !selectedTagId)) return
    setPendingAction(action)
    setError(null)
    try {
      if (action === 'ai') await onRetry()
      else await onAssignManually(selectedTagId as string)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'タグの付与に失敗しました')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="flex w-full max-w-[650px] flex-col gap-5 rounded-xl border border-border bg-background p-8">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-informative" aria-hidden />
        <h2 className="font-heading text-heading-4">タグを付与できませんでした</h2>
      </div>
      <Separator />
      <p className="text-paragraph text-muted-foreground">
        質問の投稿は完了しています。AIでもう一度試すか、カテゴリーを選択してください。
      </p>
      {error && (
        <p role="alert" className="text-paragraph-small text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={() => run('ai')}
        isDisabled={pendingAction !== null}
      >
        {pendingAction === 'ai' ? 'AIで再試行中…' : 'AIでもう一度試す'}
      </Button>
      <div className="flex flex-col gap-3">
        <Label htmlFor="recoveryTagId" className="font-bold">
          自分でカテゴリーを選ぶ
        </Label>
        <SelectCategories
          id="recoveryTagId"
          categories={tagOptions}
          value={selectedTagId}
          onValueChange={setSelectedTagId}
          placeholder="カテゴリーを選択"
          noneLabel="カテゴリーを選択"
          disabled={pendingAction !== null}
        />
        <Button
          type="button"
          onClick={() => run('manual')}
          isDisabled={pendingAction !== null || !selectedTagId}
        >
          {pendingAction === 'manual' ? 'タグを付与中…' : '選択したタグを付与する'}
        </Button>
      </div>
    </div>
  )
}
