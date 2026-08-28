import type { NotificationType } from '@/app/generated/prisma/enums'
import type { NotificationPanelEntry } from '@/components/design-system/ui/notification-panel'
import { formatRelativeTime } from '@/lib/date-time'
import { HIROBA_CATALOG } from '@/lib/hiroba/catalog'

/** 通知APIのレスポンス1件。必要なフィールドだけを構造的に受け取る。 */
type NotificationApiItem = {
  id: string
  type: NotificationType
  isRead: boolean
  createdAt: string | Date
  post?: { id: string; title: string } | null
  answer?: { postId: string } | null
  hirobaPost?: { id: string; hirobaId: string } | null
  hirobaAnswer?: { hirobaPostId: string; hirobaPost?: { hirobaId: string } | null } | null
}

/** タイトルが取れないときは鉤括弧ごと落とす */
function quoteTitle(title: string | undefined) {
  return title ? `「${title}」` : ''
}

function buildMessage(notification: NotificationApiItem, isHiroba: boolean) {
  const questionTitle = quoteTitle(notification.post?.title)

  switch (notification.type) {
    case 'POST_ANSWERED':
      return `あなたの質問${questionTitle}に新しい回答がつきました`
    case 'POST_LIKED':
      return `あなたの質問${questionTitle}にいいねがつきました`
    case 'ANSWER_LIKED':
      return 'あなたの回答にいいねがつきました'
    case 'POST_DELETED':
      return `あなたの質問${questionTitle}は運営により削除されました`
    case 'ANSWER_HIDDEN':
      return 'あなたの回答は運営により非表示になりました'
    case 'HIROBA_POST_ANSWERED':
      return 'あなたの投稿に新しいコメントがつきました'
    case 'HIROBA_POST_LIKED':
      return 'あなたの投稿にいいねがつきました'
    case 'HIROBA_ANSWER_LIKED':
      return 'あなたのコメントにいいねがつきました'
    case 'MENTIONED':
      return isHiroba
        ? 'ひろばの投稿であなたがメンションされました'
        : '質問の回答であなたがメンションされました'
  }
}

function hirobaSlug(hirobaId: string | undefined) {
  return HIROBA_CATALOG.find((hiroba) => hiroba.id === hirobaId)?.slug
}

function buildHref(notification: NotificationApiItem) {
  if (notification.hirobaPost) {
    const slug = hirobaSlug(notification.hirobaPost.hirobaId)
    return slug ? `/hiroba/${slug}/posts/${notification.hirobaPost.id}` : undefined
  }
  if (notification.hirobaAnswer) {
    const slug = hirobaSlug(notification.hirobaAnswer.hirobaPost?.hirobaId)
    return slug ? `/hiroba/${slug}/posts/${notification.hirobaAnswer.hirobaPostId}` : undefined
  }
  const postId = notification.post?.id ?? notification.answer?.postId
  return postId ? `/posts/${postId}` : undefined
}

/** 通知APIのレスポンスを NotificationPanel が受け取る形へ変換する。 */
export function toNotificationEntry(
  notification: NotificationApiItem,
  now?: number,
): NotificationPanelEntry {
  const isHiroba = Boolean(notification.hirobaPost || notification.hirobaAnswer)

  return {
    id: notification.id,
    type: isHiroba ? 'square' : 'qa',
    message: buildMessage(notification, isHiroba),
    timestamp: formatRelativeTime(notification.createdAt, now),
    isRead: notification.isRead,
    href: buildHref(notification),
  }
}

export type { NotificationApiItem }
