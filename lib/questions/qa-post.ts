import type { BookmarkQuestionItemData } from '@/components/design-system/ui/bookmark-question-item-list'
import type { MyQuestionItemData } from '@/components/design-system/ui/my-question-item-list'
import type { QuestionItemData } from '@/components/design-system/ui/question-item-list'
import { formatDateJst, formatRelativeTime } from '@/lib/date-time'
import { stripMarkdown } from '@/lib/text/strip-markdown'

export type QaPost = {
  id: string
  title: string
  body: string
  displayName: string
  avatarUrl?: string | null
  isOwnQuestion: boolean
  likeCount: number
  liked: boolean
  bookmarkCount: number
  saved: boolean
  status: 'OPEN' | 'RESOLVED'
  answerCount: number
  tags: { id: string; name: string }[]
  createdAt: Date | string
  activityAt: Date | string
  updatedAt: Date | string
}

type ApiQuestion = {
  id: string
  title: string
  body: string
  displayAuthor: { displayName: string; avatarUrl?: string | null }
  isOwnQuestion: boolean
  likeCount: number
  liked: boolean
  bookmarkCount: number
  saved: boolean
  status: 'OPEN' | 'RESOLVED'
  answerCount: number
  tag: { id: string; name: string } | null
  createdAt: Date | string
  activityAt: Date | string
  updatedAt: Date | string
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
    bookmarkCount: question.bookmarkCount,
    saved: question.saved,
    status: question.status,
    answerCount: question.answerCount,
    tags: question.tag ? [question.tag] : [],
    createdAt: question.createdAt,
    activityAt: question.activityAt,
    updatedAt: question.updatedAt,
  }
}

function excerpt(body: string) {
  const plain = stripMarkdown(body)
  return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain
}

export function toQuestionItemData(post: QaPost, now?: number): QuestionItemData {
  return {
    id: post.id,
    postId: post.id,
    href: `/posts/${post.id}`,
    authorName: post.displayName,
    avatarSrc: post.avatarUrl ?? undefined,
    category: post.tags[0]?.name,
    status: post.status,
    timestamp: formatRelativeTime(post.activityAt, now),
    title: post.title,
    excerpt: excerpt(post.body),
    commentCount: post.answerCount,
    likeCount: post.likeCount,
    liked: post.liked,
    bookmarkCount: post.bookmarkCount,
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
