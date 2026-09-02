import { AdminNav } from '@/components/admin/admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-panel min-h-screen">
      <AdminNav />
      <main className="p-4 lg:p-8">{children}</main>
    </div>
  )
}
