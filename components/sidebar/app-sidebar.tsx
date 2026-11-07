"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessagesCircle,
  Newspaper,
  PanelLeft,
  SquareTerminal,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavHistory, NavProjects } from "./nav-items";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  projects: [
    { name: "Nova conversa", url: "/novo", icon: MessagesCircle },
    { name: "Diagnóstico", url: "/analise", icon: Newspaper },
  ],
  history: [] as { id: string; title: string; url: string }[],
};

function SidebarLogo() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Abrir sidebar"
      className="group/logo relative hidden size-8 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sky-100 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:flex"
    >
      <SquareTerminal className="size-5 group-hover/logo:hidden group-focus-visible/logo:hidden" />
      <PanelLeft className="hidden size-5 group-hover/logo:block group-focus-visible/logo:block" />
    </button>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-between gap-2 group-data-[collapsible=icon]:gap-0">
              <div className="flex gap-2">
                {/* Tile da logo */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sky-100 shadow-sm group-data-[collapsible=icon]:hidden">
                  <SquareTerminal className="size-5" />
                </div>

                {/* Textos (somem no modo ícone) */}
                <div className="flex flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-base font-bold tracking-tight">
                    SmartInterview AI
                  </span>
                  <span className="truncate text-xs font-medium text-sidebar-foreground/60 -mt-1">
                    Seu TechLead Pessoal
                  </span>
                </div>
              </div>
              <SidebarLogo />
              <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavProjects projects={data.projects} />
        <NavHistory items={data.history} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
