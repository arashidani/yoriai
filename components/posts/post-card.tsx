'use client'

import { QuestionItem } from '@/components/design-system/ui/question-item'
import { type QaPost, toQuestionItemData } from '@/lib/questions/qa-post'
import { DeletePostButton } from './delete-post-button'

type PostCardProps = {
  post: QaPost
  isAdmin?: boolean
  onDeleted?: (postId: string) => void
}

export function PostCard({ post, isAdmin = false, onDeleted }: PostCardProps) {
  const canDelete = isAdmin && onDeleted
  const item = toQuestionItemData(post)

  return (
    <div className="relative">
      {canDelete && (
        <div className="absolute top-3 right-3 z-10">
          <DeletePostButton postId={post.id} postTitle={post.title} onDeleted={onDeleted} />
        </div>
      )}
      <QuestionItem {...item} />
    </div>
  )
}
