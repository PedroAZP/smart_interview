"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReportOut } from "@/lib/api";

interface ReportDialogProps {
  report: ReportOut | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDialog({ report, isOpen, onClose }: ReportDialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const strengths = report.items.filter((it) => it.kind === "strength");
  const blindSpots = report.items.filter((it) => it.kind === "blind_spot");
  const improvements = report.items.filter((it) => it.kind === "improvement");

  function getScoreBadge(score: number) {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }

  function getScoreBar(score: number) {
    if (score >= 80) return "bg-emerald-400";
    if (score >= 60) return "bg-cyan-400";
    return "bg-amber-400";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteúdo Modal com rolagem interna */}
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border/80 bg-card shadow-2xl">
        {/* Header fixo */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Award className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Diagnóstico de Desempenho
              </h2>
              <p className="text-xs text-muted-foreground">
                Avaliação completa gerada pelo Tech Lead
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-8">
          {/* Grid de Pontuações */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Nota Geral */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/20 p-5 text-center">
              <span className="text-xs font-medium text-muted-foreground">
                Nota Geral
              </span>
              <div
                className={cn(
                  "mt-2 flex size-16 items-center justify-center rounded-full border text-2xl font-bold",
                  getScoreBadge(report.score)
                )}
              >
                {report.score}
              </div>
              <span className="mt-2 text-[11px] text-muted-foreground">
                escala 0 a 100
              </span>
            </div>

            {/* Sub-notas detalhadas */}
            <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:col-span-3">
              {/* Técnica */}
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Competência Técnica</span>
                  <span className="font-semibold text-foreground">
                    {report.score_technical}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getScoreBar(report.score_technical)
                    )}
                    style={{ width: `${report.score_technical}%` }}
                  />
                </div>
              </div>

              {/* Comunicação */}
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Comunicação e Clareza</span>
                  <span className="font-semibold text-foreground">
                    {report.score_communication}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getScoreBar(report.score_communication)
                    )}
                    style={{ width: `${report.score_communication}%` }}
                  />
                </div>
              </div>

              {/* Alinhamento */}
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Alinhamento & Postura</span>
                  <span className="font-semibold text-foreground">
                    {report.score_alignment}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getScoreBar(report.score_alignment)
                    )}
                    style={{ width: `${report.score_alignment}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-cyan-400" />
              Parecer do Entrevistador
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {report.summary}
            </p>
          </div>

          {/* Pontos Fortes */}
          {strengths.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="size-4" />
                Pontos Fortes Demonstrados
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {strengths.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5"
                  >
                    {item.topic && (
                      <span className="block text-xs font-semibold text-emerald-300">
                        {item.topic}
                      </span>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pontos Cegos */}
          {blindSpots.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <AlertTriangle className="size-4" />
                Pontos de Atenção & Pontos Cegos
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {blindSpots.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5"
                  >
                    {item.topic && (
                      <span className="block text-xs font-semibold text-amber-300">
                        {item.topic}
                      </span>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plano de Melhoria */}
          {improvements.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-400">
                <Lightbulb className="size-4" />
                Plano de Ação e Recomendações de Estudo
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {improvements.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5"
                  >
                    {item.topic && (
                      <span className="block text-xs font-semibold text-sky-300">
                        {item.topic}
                      </span>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-6 py-4 sm:px-8">
          <Link
            href="/analise"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Ver histórico de diagnósticos
            <ExternalLink className="size-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-muted px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/80"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

