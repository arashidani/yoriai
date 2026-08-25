import Link from 'next/link'

import { AuthorAvatar } from '@/components/design-system/ui/author-avatar'
import { cn } from '@/lib/utils'

type SideQuestionItemProps = {
  className?: string
  href?: string
  avatarSrc?: string
  avatarAlt?: string
  title: string
  excerpt?: string
}

function SideQuestionItem({
  className,
  href,
  avatarSrc,
  avatarAlt = '',
  title,
  excerpt,
}: SideQuestionItemProps) {
  const content = (
    <div className="flex w-full items-start gap-2">
      <AuthorAvatar src={avatarSrc} alt={avatarAlt} className="size-9.5" sizes="38px" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-paragraph-small font-medium text-foreground">{title}</p>
        {excerpt ? (
          <p className="truncate text-paragraph-mini font-medium text-muted-foreground">
            {excerpt}
          </p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div
      data-slot="side-question-item"
      className={cn('flex w-full flex-col items-start p-4 hover:bg-muted', className)}
    >
      {href ? (
        <Link href={href} className="w-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  )
}

export type { SideQuestionItemProps }
export { SideQuestionItem }
