'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'

import { tabButtonClassName } from '@/components/design-system/ui/tab-button'
import { cn } from '@/lib/utils'

type TabBarItem = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
}

type TabBarProps = Omit<TabsPrimitive.Root.Props, 'children'> & {
  className?: string
  items: TabBarItem[]
}

function TabBar({ className, items, ...props }: TabBarProps) {
  return (
    <TabsPrimitive.Root data-slot="tab-bar" {...props}>
      <TabsPrimitive.List className={cn('inline-flex items-end gap-2', className)}>
        {items.map(({ value, label, icon }) => (
          <TabsPrimitive.Tab key={value} value={value} className={tabButtonClassName}>
            {icon && <span className="size-4 shrink-0 overflow-clip">{icon}</span>}
            {label}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  )
}

export type { TabBarItem }
export { TabBar }
