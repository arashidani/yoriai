import { Input as InputPrimitive } from '@base-ui/react/input'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

type KeywordInputProps = InputPrimitive.Props

function KeywordInput({
  className,
  placeholder = 'キーワードを入力',
  ...props
}: KeywordInputProps) {
  return (
    <div
      data-slot="keyword-input"
      className="flex items-center gap-2 rounded-lg border-2 border-input bg-card p-3"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <InputPrimitive
        placeholder={placeholder}
        className={cn(
          'w-full min-w-0 text-paragraph-small font-medium text-foreground outline-none placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export { KeywordInput }
