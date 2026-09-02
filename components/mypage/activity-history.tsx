import Image, { type StaticImageData } from 'next/image'

export type ActivityItem = {
  id: string
  icon: StaticImageData
  text: string
}

export function ActivityHistory({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-background-2 space-y-3 p-6 w-82.5 self-start">
      <h3 className="text-heading-3 text-foreground">最近の活動履歴</h3>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-2 items-start border-b border-border-3 pb-3 last:border-b-0 last:pb-0"
        >
          <Image src={item.icon} alt="" className="mt-1" />

          <p className="text-body-small text-secondary-foreground">{item.text}</p>
        </div>
      ))}
    </div>
  )
}
