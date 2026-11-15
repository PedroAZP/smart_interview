"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

function AppLayoutShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/cadastro";

  if (isAuthRoute) {
    return <main className="min-h-svh w-full flex-1">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={<main className="min-h-svh w-full flex-1">{children}</main>}
    >
      <AppLayoutShellInner>{children}</AppLayoutShellInner>
    </React.Suspense>
  );
}
