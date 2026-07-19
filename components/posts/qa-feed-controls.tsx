'use client'

import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type QaFeedCategorySelectProps = {
  categories: string[]
}

function QaFeedCategorySelect({ categories }: QaFeedCategorySelectProps) {
  return (
    <SelectPrimitive.Root>
      <SelectPrimitive.Trigger
        data-size="default"
        className={cn(
          "flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-background py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 sm:flex-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        )}
      >
        <SelectPrimitive.Value
          data-slot="select-value"
          className="flex flex-1 text-left"
          placeholder="カテゴリーを選択"
        />
        <SelectPrimitive.Icon
          render={<ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />}
        />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="center"
          alignOffset={0}
          alignItemWithTrigger
          className="isolate z-50"
        >
          <SelectPrimitive.Popup
            data-align-trigger
            className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <SelectPrimitive.ScrollUpArrow className="top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4">
              <ChevronUpIcon />
            </SelectPrimitive.ScrollUpArrow>
            <SelectPrimitive.List>
              {categories.map((category) => (
                <SelectPrimitive.Item
                  key={category}
                  value={category}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                >
                  <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                    {category}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator
                    render={
                      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
                    }
                  >
                    <CheckIcon className="pointer-events-none" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
            <SelectPrimitive.ScrollDownArrow className="bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4">
              <ChevronDownIcon />
            </SelectPrimitive.ScrollDownArrow>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
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

export { QaFeedCategorySelect, QaFeedStatusFilter }
