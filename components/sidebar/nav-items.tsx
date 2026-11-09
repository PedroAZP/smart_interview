"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ---------------------------------------------------------------------------
// Componentes internos que usam usePathname() — ficam dentro do <Suspense>
// ---------------------------------------------------------------------------

function NavProjectsInner({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navegação</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              tooltip={item.name}
              isActive={pathname === item.url}
              render={<Link href={item.url} />}
            >
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavHistoryInner({
  items,
}: {
  items: { id: string; title: string; url: string }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Histórico de conversas</SidebarGroupLabel>
      {items.length === 0 ? (
        <p className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Nenhuma conversa ainda
        </p>
      ) : (
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={pathname === item.url}
                render={<Link href={item.url} />}
              >
                <span className="truncate">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}

// ---------------------------------------------------------------------------
// Exports públicos: envolvem os internos em <Suspense> para que o
// prerender não bloqueie em rotas dinâmicas (ex: /chat/[id])
// ---------------------------------------------------------------------------

export function NavProjects({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[];
}) {
  return (
    <React.Suspense fallback={<NavProjectsFallback projects={projects} />}>
      <NavProjectsInner projects={projects} />
    </React.Suspense>
  );
}

export function NavHistory({
  items,
}: {
  items: { id: string; title: string; url: string }[];
}) {
  return (
    <React.Suspense fallback={<NavHistoryFallback />}>
      <NavHistoryInner items={items} />
    </React.Suspense>
  );
}

// ---------------------------------------------------------------------------
// Fallbacks simples (sem isActive, apenas renderizam os links)
// ---------------------------------------------------------------------------

function NavProjectsFallback({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navegação</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton tooltip={item.name} render={<Link href={item.url} />}>
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavHistoryFallback() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Histórico de conversas</SidebarGroupLabel>
      <p className="px-2 py-1 text-xs text-sidebar-foreground/50">
        Carregando...
      </p>
    </SidebarGroup>
  );
}
