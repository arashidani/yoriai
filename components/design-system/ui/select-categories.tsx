'use client'

import { Select as SelectPrimitive } from '@base-ui/react/select'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
}

const NONE_LABEL = 'なし'

type SelectCategoriesProps = Omit<
  SelectPrimitive.Root.Props<string | null>,
  'children' | 'items'
> & {
  className?: string
  categories: Category[]
  placeholder?: string
  noneLabel?: string
}

function SelectCategories({
  className,
  categories,
  placeholder = 'カテゴリーを選択',
  noneLabel = NONE_LABEL,
  ...rootProps
}: SelectCategoriesProps) {
  const items = [
    { label: noneLabel, value: null },
    ...categories.map((category) => ({ label: category.name, value: category.id })),
  ]

  return (
    <SelectPrimitive.Root items={items} {...rootProps}>
      <SelectPrimitive.Trigger
        data-slot="select-categories"
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border-2 border-input bg-card p-3 text-paragraph-small font-medium text-foreground outline-none select-none data-placeholder:text-muted-foreground',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="flex-1 text-left" />
        <SelectPrimitive.Icon
          render={<ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />}
        />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4} className="isolate z-50">
          <SelectPrimitive.Popup className="max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border border-neutral-400 bg-background text-foreground duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <SelectPrimitive.List>
              <SelectPrimitive.Item
                value={null}
                label={noneLabel}
                className="relative flex min-h-9 w-full cursor-default items-center gap-3 p-3 pr-9 text-paragraph-small font-medium outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                  {noneLabel}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="pointer-events-none absolute right-3 flex size-4 items-center justify-center">
                  <CheckIcon className="pointer-events-none size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
              {categories.map((category) => (
                <SelectPrimitive.Item
                  key={category.id}
                  value={category.id}
                  className="relative flex min-h-9 w-full cursor-default items-center gap-3 p-3 pr-9 text-paragraph-small font-medium outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                    {category.name}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="pointer-events-none absolute right-3 flex size-4 items-center justify-center">
                    <CheckIcon className="pointer-events-none size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { SelectCategories }
