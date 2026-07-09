"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

type SidebarNavLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
};

export function SidebarNavLink({ href, children }: SidebarNavLinkProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuButton
      render={<Link href={href} onClick={() => isMobile && setOpenMobile(false)} />}
    >
      {children}
    </SidebarMenuButton>
  );
}
