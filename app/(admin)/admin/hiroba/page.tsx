import { HirobaCard } from '@/components/hiroba/hiroba-card'
import { HIROBA_SECTIONS } from '@/lib/hiroba/catalog'

export default function AdminHirobaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ひろば管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ひろばはサービス共通の固定カテゴリです。管理画面からの追加・削除はできません。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {HIROBA_SECTIONS.map((section) => (
          <section key={section.title} className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">{section.title}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.items.map((hiroba) => (
                <HirobaCard key={hiroba.id} hiroba={hiroba} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
