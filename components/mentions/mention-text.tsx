import { parseUserText } from '@/lib/text/parse-user-text'
import { cn } from '@/lib/utils'

type MentionTextProps = {
  text: string
  /** カード全体がリンクのときなど、URL に追加で当てる className */
  linkClassName?: string
  /** Markdown 内ではリンク化済みなので、メンションだけ処理する */
  parseUrls?: boolean
}

export function MentionText({ text, linkClassName, parseUrls = true }: MentionTextProps) {
  return (
    <>
      {parseUserText(text).map((segment) => {
        if (segment.type === 'mention') {
          return (
            <span
              key={segment.start}
              className="rounded-sm bg-primary/10 px-0.5 font-medium text-primary"
            >
              {segment.value}
            </span>
          )
        }

        if (segment.type === 'url' && parseUrls) {
          return (
            <a
              key={segment.start}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'break-all text-primary underline underline-offset-2 hover:text-primary-hover',
                linkClassName,
              )}
            >
              {segment.value}
            </a>
          )
        }

        return <span key={segment.start}>{segment.value}</span>
      })}
    </>
  )
}
