import Image from 'next/image'
import inu from '@/assets/mascots/mascot_xx.svg'
import { ToolChip } from '@/components/design-system/ui/tool-chip'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationPanelColumn } from '@/components/notifications/notification-panel-column'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col pt-1.5 lg:flex-row">
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-primary" />
      <Sidebar />

      <NotificationPanelColumn />

      <main className="flex min-w-0 flex-1 items-center justify-center bg-background">
        <div className="space-y-12">
          <div className="space-y-4 text-center">
            <p className="text-heading-1 text-muted-foreground">404 Not Found</p>

            <p className="text-body-small font-medium text-muted-foreground">
              URLが変更されたか、ページが削除された可能性があります。
              <br />
              お手数ですが、左のナビゲーションから目的のページをお探しください。
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <ToolChip text="ここどこだワン..." side="bottom" />
            <Image
              src={inu}
              width={181}
              height={196}
              alt="困っているよりあいぬ"
              className="-scale-x-100"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
