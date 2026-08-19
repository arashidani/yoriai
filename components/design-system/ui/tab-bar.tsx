'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import Link from 'next/link'
import type { ComponentProps } from 'react'

import { tabButtonClassName } from '@/components/design-system/ui/tab-button'
import { cn } from '@/lib/utils'

type TabBarItem = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  /** 指定するとタブが `next/link` として描画され、URL遷移でタブを切り替えられる。 */
  href?: ComponentProps<typeof Link>['href']
}

type TabBarProps = Omit<TabsPrimitive.Root.Props, 'children'> & {
  className?: string
  items: TabBarItem[]
}

function TabBar({ className, items, ...props }: TabBarProps) {
  return (
    <TabsPrimitive.Root data-slot="tab-bar" {...props}>
      <TabsPrimitive.List className={cn('inline-flex items-end gap-2', className)}>
        {items.map(({ value, label, icon, href }) => (
          <TabsPrimitive.Tab
            key={value}
            value={value}
            className={tabButtonClassName}
            render={href ? <Link href={href} /> : undefined}
            nativeButton={!href}
          >
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
