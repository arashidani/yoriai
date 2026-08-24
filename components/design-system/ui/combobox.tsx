'use client'

import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { ChevronDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ComboboxOption = { value: string; label: string }

type ComboboxProps = Omit<
  ComponentProps<typeof ComboboxPrimitive.Root<ComboboxOption>>,
  'items'
> & {
  options: ComboboxOption[]
  placeholder?: string
  emptyMessage?: string
  className?: string
  'aria-invalid'?: boolean
}

function Combobox({
  options,
  placeholder,
  emptyMessage = '一致する項目がありません',
  className,
  'aria-invalid': ariaInvalid,
  ...props
}: ComboboxProps) {
  return (
    <ComboboxPrimitive.Root items={options} {...props}>
      <ComboboxPrimitive.InputGroup
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border-2 border-border-3 bg-card px-3 py-2 data-[popup-open]:border-border-4 data-[popup-open]:ring-3 data-[popup-open]:ring-ring/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          ariaInvalid && 'border-destructive ring-3 ring-destructive/20',
          className,
        )}
      >
        <ComboboxPrimitive.Input
          placeholder={placeholder}
          className="min-h-5 w-full flex-1 bg-transparent text-paragraph-small font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        <ComboboxPrimitive.Icon className="flex shrink-0 items-center text-muted-foreground">
          <ChevronDownIcon className="size-4" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.InputGroup>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="isolate z-50">
          <ComboboxPrimitive.Popup className="max-h-(--available-height) w-(--anchor-width) min-w-36 overflow-y-auto rounded-lg border border-border-4 bg-card p-1 text-card-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <ComboboxPrimitive.Empty className="px-3 py-2 text-paragraph-small text-muted-foreground">
              {emptyMessage}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="flex min-h-9 cursor-default items-center rounded-md p-3 text-paragraph-small outline-hidden select-none data-highlighted:bg-secondary-hover data-highlighted:text-foreground"
                >
                  {item.label}
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

export type { ComboboxOption }
export { Combobox }
