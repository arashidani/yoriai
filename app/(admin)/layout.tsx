import { ArrowLeft, FileText, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Role } from '@/app/generated/prisma/enums';
import { SidebarNavLink } from '@/components/admin/sidebar-nav-link';
import { LogoutButton } from '@/components/logout-button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) redirect('/');

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="px-2 py-1.5 font-bold text-lg">
            社内Q&A
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarNavLink href="/admin">
                    <LayoutDashboard />
                    <span>ダッシュボード</span>
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/admin/posts">
                    <FileText />
                    <span>投稿管理</span>
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/admin/users">
                    <Users />
                    <span>ユーザー管理</span>
                  </SidebarNavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavLink href="/">
                <ArrowLeft />
                <span>ユーザー画面へ戻る</span>
              </SidebarNavLink>
            </SidebarMenuItem>
          </SidebarMenu>
          <LogoutButton />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
