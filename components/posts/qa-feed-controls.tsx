'use client'

import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
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

/** タグのドロップダウンチェックリスト。複数選択した場合はAND条件（すべてのタグを含む投稿のみ）で絞り込む。 */
function QaFeedTagFilter({ tags, selectedTagIds, onChange }: QaFeedTagFilterProps) {
  function toggleTag(tagId: string, checked: boolean) {
    onChange(checked ? [...selectedTagIds, tagId] : selectedTagIds.filter((id) => id !== tagId))
  }

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-background py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        )}
      >
        <span className="flex flex-1 text-left">
          {selectedTagIds.length > 0 ? `タグ (${selectedTagIds.length})` : 'タグで絞り込み'}
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
            {tags.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">タグがありません</div>
            ) : (
              tags.map((tag) => {
                const checked = selectedTagIds.includes(tag.id)
                return (
                  <MenuPrimitive.CheckboxItem
                    key={tag.id}
                    checked={checked}
                    onCheckedChange={(nextChecked) => toggleTag(tag.id, nextChecked)}
                    className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">{tag.name}</span>
                    <MenuPrimitive.CheckboxItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                      <CheckIcon className="pointer-events-none" />
                    </MenuPrimitive.CheckboxItemIndicator>
                  </MenuPrimitive.CheckboxItem>
                )
              })
            )}
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
      data-slot="toggle-group"
      data-spacing={0}
      data-orientation="horizontal"
      orientation="horizontal"
      aria-label="ステータスで絞り込み"
      className="group/toggle-group grid h-10 w-full grid-cols-3 rounded-lg border-2 border-input bg-background sm:flex sm:w-fit sm:shrink-0"
    >
      {filters.map(({ id, label }) => (
        <TogglePrimitive
          key={id}
          value={id}
          data-slot="toggle-group-item"
          data-spacing={0}
          className={cn(
            "group/toggle inline-flex h-full min-w-0 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-paragraph-small font-medium whitespace-nowrap text-secondary-foreground transition-all outline-none hover:bg-muted hover:text-foreground focus:z-10 focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-secondary-hover aria-pressed:font-bold dark:aria-invalid:ring-destructive/40 sm:px-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            'group-data-[spacing=0]/toggle-group:rounded-none group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg not-last:border-r-2 not-last:border-input',
          )}
        >
          {label}
        </TogglePrimitive>
      ))}
    </ToggleGroupPrimitive>
  )
}

export { QaFeedStatusFilter, QaFeedTagFilter }
