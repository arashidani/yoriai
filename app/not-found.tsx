import { NotFoundContent } from '@/components/layout/not-found-content'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationPanelColumn } from '@/components/notifications/notification-panel-column'

/** どのルートにも一致しないURL向けの404。レイアウトを持たないため自前でシェルを描画する。 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col pt-1.5 lg:flex-row">
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-primary" />
      <Sidebar />

      <NotificationPanelColumn />

      <main className="flex min-w-0 flex-1 items-center justify-center bg-background">
        <NotFoundContent />
      </main>
    </div>
  )
}
