'use client'

import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { FilterChip } from '@/components/design-system/ui/filter-chip'
import { cn } from '@/lib/utils'

type Tag = {
  id: string
  name: string
}

type QaFeedTagFilterProps = {
  tags: Tag[]
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}

const NONE_TAG_LABEL = 'なし'
const TAG_CHECKBOX_ITEM_CLASS =
  "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/** タグのドロップダウンチェックリスト。択一。「なし」は tagId を送らず絞り込まない */
function QaFeedTagFilter({ tags, selectedTagIds, onChange }: QaFeedTagFilterProps) {
  const selectedTag = tags.find((tag) => selectedTagIds.includes(tag.id))
  const isNoneSelected = selectedTagIds.length === 0
  const items = [{ id: null, name: NONE_TAG_LABEL }, ...tags]

  function selectTag(tagId: string | null) {
    onChange(tagId ? [tagId] : [])
  }

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border-3 border-input bg-background py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left',
            !selectedTag && 'text-muted-foreground',
          )}
        >
          {selectedTag ? selectedTag.name : 'カテゴリーを選択'}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="center"
          alignOffset={0}
          className="isolate z-50"
        >
          <MenuPrimitive.Popup className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {items.map((item) => {
              const checked = item.id === null ? isNoneSelected : selectedTagIds.includes(item.id)
              return (
                <MenuPrimitive.CheckboxItem
                  key={item.id ?? 'none'}
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    if (nextChecked) selectTag(item.id)
                  }}
                  className={TAG_CHECKBOX_ITEM_CLASS}
                >
                  <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">{item.name}</span>
                  <MenuPrimitive.CheckboxItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="pointer-events-none" />
                  </MenuPrimitive.CheckboxItemIndicator>
                </MenuPrimitive.CheckboxItem>
              )
            })}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

type StatusFilter = {
  id: string
  label: string
}

type QaFeedStatusFilterProps = {
  filters: StatusFilter[]
  value: string
  onValueChange: (value: string) => void
}

function QaFeedStatusFilter({ filters, value, onValueChange }: QaFeedStatusFilterProps) {
  return (
    <ToggleGroupPrimitive
      value={[value]}
      onValueChange={(nextValue) => {
        const selectedValue = nextValue.at(-1)
        if (typeof selectedValue === 'string') onValueChange(selectedValue)
      }}
      orientation="horizontal"
      aria-label="ステータスで絞り込み"
      className="flex flex-wrap items-center gap-2"
    >
      {filters.map(({ id, label }) => (
        <FilterChip key={id} value={id}>
          {label}
        </FilterChip>
      ))}
    </ToggleGroupPrimitive>
  )
}

export { QaFeedStatusFilter, QaFeedTagFilter }
