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
import { listInterviews, type InterviewSummary } from "@/lib/api";
import { useGuestId } from "@/hooks/use-guest-id";

const STATIC_PROJECTS = [
  { name: "Nova conversa", url: "/", icon: MessagesCircle },
  { name: "Diagnóstico", url: "/analise", icon: Newspaper },
];

const STATIC_USER = {
  name: "Pedro",
  email: "pedro@exemplo.com",
  avatar: "/avatars/shadcn.jpg",
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
  const guestId = useGuestId();
  const [history, setHistory] = React.useState<InterviewSummary[]>([]);

  const fetchHistory = React.useCallback(() => {
    if (!guestId) return;
    listInterviews(guestId)
      .then(setHistory)
      .catch(() => {
        // Silencia o erro — o backend pode estar offline durante dev
      });
  }, [guestId]);

  // Busca o histórico quando o guestId estiver disponível e ouve atualizações
  React.useEffect(() => {
    fetchHistory();

    const handleUpdate = () => {
      fetchHistory();
    };

    window.addEventListener("interviews-changed", handleUpdate);
    return () => {
      window.removeEventListener("interviews-changed", handleUpdate);
    };
  }, [fetchHistory]);

  const historyItems = history.map((item) => ({
    id: item.id,
    title: item.title,
    url: `/chat/${item.id}`,
  }));

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
        <NavProjects projects={STATIC_PROJECTS} />
        <NavHistory items={historyItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={STATIC_USER} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
