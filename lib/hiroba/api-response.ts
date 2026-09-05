import type { Prisma } from '@/app/generated/prisma/client'
import { publicPostAuthorSelect, publicTagSelect } from '@/lib/prisma/selects'

export const hirobaPostInclude = {
  author: { select: publicPostAuthorSelect },
  tags: { include: { tag: { select: publicTagSelect } } },
} as const

export type HirobaPostWithPublicAuthor = Prisma.HirobaPostGetPayload<{
  include: typeof hirobaPostInclude
}>

export const hirobaAnswerInclude = {
  author: { select: publicPostAuthorSelect },
} as const

export type HirobaAnswerWithPublicAuthor = Prisma.HirobaAnswerGetPayload<{
  include: typeof hirobaAnswerInclude
}>

type PublicPostAuthorInput = Prisma.UserGetPayload<{ select: typeof publicPostAuthorSelect }>

export function toPublicPostAuthor(
  author: PublicPostAuthorInput | null | undefined,
): PublicPostAuthorInput | null {
  return author ?? null
}

export function mapHirobaPostResponse(post: HirobaPostWithPublicAuthor) {
  return {
    ...post,
    author: toPublicPostAuthor(post.author),
    tags: post.tags.map((postTag) => postTag.tag),
  }
}

/**
 * レスポンスに載せるフィールドだけを要求する。Prisma の行をそのまま渡すこともできるし、
 * モックのように内部フィールド（`hiddenAt` など）を持たないデータも渡せる。
 */
export type HirobaAnswerResponseInput = Pick<
  HirobaAnswerWithPublicAuthor,
  | 'id'
  | 'hirobaPostId'
  | 'body'
  | 'authorId'
  | 'author'
  | 'isHidden'
  | 'likeCount'
  | 'createdAt'
  | 'updatedAt'
>

export function toHirobaAnswerResponse(answer: HirobaAnswerResponseInput) {
  return {
    id: answer.id,
    hirobaPostId: answer.hirobaPostId,
    body: answer.body,
    authorId: answer.authorId,
    author: toPublicPostAuthor(answer.author),
    isHidden: answer.isHidden,
    likeCount: answer.likeCount,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}
