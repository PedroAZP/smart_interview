"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, LogIn, type LucideIcon } from "lucide-react";

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
  isAuthenticated,
}: {
  items: { id: string; title: string; url: string }[];
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Histórico de conversas</SidebarGroupLabel>
      {!isAuthenticated ? (
        <div className="mx-2 my-1 rounded-xl border border-dashed border-border/80 bg-muted/30 p-3 text-center">
          <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <Lock className="size-4" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            Histórico exclusivo
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Inicie sua sessão para salvar automaticamente suas conversas e acessar diagnósticos.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
          >
            <LogIn className="size-3.5" />
            Entrar ou cadastrar
          </Link>
        </div>
      ) : items.length === 0 ? (
        <p className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Nenhuma conversa salva ainda
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
  isAuthenticated,
}: {
  items: { id: string; title: string; url: string }[];
  isAuthenticated?: boolean;
}) {
  return (
    <React.Suspense fallback={<NavHistoryFallback />}>
      <NavHistoryInner items={items} isAuthenticated={isAuthenticated} />
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
