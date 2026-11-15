"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  ChevronRight,
  ExternalLink,
  Lock,
  LogIn,
  MessagesCircle,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { listUserReports, type ReportOut } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ReportDialog } from "@/components/report-dialog";

export default function AnalisePage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [reports, setReports] = React.useState<ReportOut[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedReport, setSelectedReport] = React.useState<ReportOut | null>(
    null
  );

  React.useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    listUserReports(token)
      .then((data) => {
        setReports(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [token]);

  // Loading da autenticação
  if (isAuthLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="text-sm text-muted-foreground animate-pulse">
          Carregando dados...
        </span>
      </div>
    );
  }

  // Estado não autenticado
  if (!user) {
    return (
      <div className="relative isolate flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_50%,rgba(56,189,248,0.08),transparent_70%)]"
        />
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-3xl border border-sky-500/20 bg-sky-500/10 text-sky-400 ring-8 ring-sky-500/5">
            <Lock className="size-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Diagnósticos exclusivos
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Acompanhe sua evolução técnica, histórico de avaliações e planos de estudo
            conduzidos pela IA em um só lugar.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <LogIn className="size-4" />
              Entrar na minha conta
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <UserPlus className="size-4" />
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cálculos de métricas
  const totalReports = reports.length;
  const avgScore = totalReports
    ? Math.round(reports.reduce((acc, r) => acc + r.score, 0) / totalReports)
    : 0;
  const avgTech = totalReports
    ? Math.round(
        reports.reduce((acc, r) => acc + r.score_technical, 0) / totalReports
      )
    : 0;
  const avgComm = totalReports
    ? Math.round(
        reports.reduce((acc, r) => acc + r.score_communication, 0) / totalReports
      )
    : 0;

  function getScoreBadge(score: number) {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Diagnósticos de Desempenho
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico das suas simulações de entrevista e métricas de evolução.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          Nova entrevista
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <span className="text-sm text-muted-foreground animate-pulse">
            Carregando seus diagnósticos...
          </span>
        </div>
      ) : totalReports === 0 ? (
        /* Sem relatórios ainda */
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20 p-12 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Award className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Nenhum diagnóstico gerado ainda
          </h2>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Inicie uma entrevista com o Tech Lead e ao finalizar clique no botão
            &ldquo;Encerrar e gerar relatório&rdquo; para desbloquear sua análise de notas.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <MessagesCircle className="size-4" />
            Começar minha primeira entrevista
          </Link>
        </div>
      ) : (
        /* Painel com Métricas e Lista */
        <div className="mt-8 space-y-8">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">
                Entrevistas Avaliadas
              </span>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {totalReports}
              </p>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                com diagnósticos completos
              </span>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">
                Média Geral de Desempenho
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {avgScore}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <span className="mt-1 block text-[11px] text-emerald-400">
                baseado em todas as simulações
              </span>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">
                Competência Técnica & Comunicação
              </span>
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block">Técnica</span>
                  <span className="text-xl font-bold text-foreground">{avgTech}%</span>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div>
                  <span className="text-xs text-muted-foreground block">Comunicação</span>
                  <span className="text-xl font-bold text-foreground">{avgComm}%</span>
                </div>
              </div>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                médias consolidadas
              </span>
            </div>
          </div>

          {/* Lista de Relatórios */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Histórico de Avaliações
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition hover:border-cyan-500/30"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl border text-lg font-bold",
                        getScoreBadge(r.score)
                      )}
                    >
                      {r.score}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          Diagnóstico #{r.id}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(r.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {r.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      href={`/chat/${r.interview_id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Ver chat
                      <ExternalLink className="size-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedReport(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                    >
                      Ver detalhes
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialog para visualização individual */}
      <ReportDialog
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

