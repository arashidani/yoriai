import type { BookmarkQuestionItemData } from '@/components/design-system/ui/bookmark-question-item-list'
import type { MyQuestionItemData } from '@/components/design-system/ui/my-question-item-list'
import type { QuestionItemData } from '@/components/design-system/ui/question-item-list'
import { formatDateJst, formatRelativeTime } from '@/lib/date-time'

export type QaPost = {
  id: string
  title: string
  body: string
  displayName: string
  avatarUrl?: string | null
  isOwnQuestion: boolean
  likeCount: number
  liked: boolean
  saved: boolean
  status: 'OPEN' | 'RESOLVED'
  answerCount: number
  tags: { id: string; name: string }[]
  createdAt: Date | string
}

type ApiQuestion = {
  id: string
  title: string
  body: string
  displayAuthor: { displayName: string; avatarUrl?: string | null }
  isOwnQuestion: boolean
  likeCount: number
  liked: boolean
  saved: boolean
  status: 'OPEN' | 'RESOLVED'
  answerCount: number
  tag: { id: string; name: string } | null
  createdAt: Date | string
}

export function toQaPost(question: ApiQuestion): QaPost {
  return {
    id: question.id,
    title: question.title,
    body: question.body,
    displayName: question.displayAuthor.displayName,
    avatarUrl: question.displayAuthor.avatarUrl,
    isOwnQuestion: question.isOwnQuestion,
    likeCount: question.likeCount,
    liked: question.liked,
    saved: question.saved,
    status: question.status,
    answerCount: question.answerCount,
    tags: question.tag ? [question.tag] : [],
    createdAt: question.createdAt,
  }
}

function excerpt(body: string) {
  return body.length > 100 ? `${body.slice(0, 100)}…` : body
}

export function toQuestionItemData(post: QaPost): QuestionItemData {
  return {
    id: post.id,
    postId: post.id,
    href: `/posts/${post.id}`,
    authorName: post.displayName,
    avatarSrc: post.avatarUrl ?? undefined,
    category: post.tags[0]?.name,
    status: post.status,
    timestamp: formatRelativeTime(post.createdAt),
    title: post.title,
    excerpt: excerpt(post.body),
    commentCount: post.answerCount,
    likeCount: post.likeCount,
    liked: post.liked,
    bookmarkCount: 0,
    bookmarked: post.saved,
    isOwnQuestion: post.isOwnQuestion,
  }
}

export function toMyQuestionItemData(post: QaPost): MyQuestionItemData {
  return {
    id: post.id,
    href: `/posts/${post.id}`,
    date: formatDateJst(post.createdAt),
    title: post.title,
    category: post.tags[0]?.name,
    excerpt: excerpt(post.body),
    commentCount: post.answerCount,
    status: post.status,
  }
}

export function toBookmarkQuestionItemData(post: QaPost): BookmarkQuestionItemData {
  return {
    id: post.id,
    href: `/posts/${post.id}`,
    date: formatDateJst(post.createdAt),
    title: post.title,
    category: post.tags[0]?.name,
    status: post.status,
    excerpt: excerpt(post.body),
    commentCount: post.answerCount,
  }
}
