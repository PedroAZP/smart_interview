"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, LogIn, UserPlus, X } from "lucide-react";

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  title = "Acesse sua conta para desbloquear o relatório",
  description = "A geração de diagnósticos detalhados, pontuação por competências e histórico de conversas são recursos exclusivos para usuários cadastrados.",
}: AuthRequiredDialogProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteúdo */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl transition-all">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-8 ring-sky-500/5">
            <Lock className="size-6" />
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <LogIn className="size-4" />
              Fazer login
            </Link>

            <Link
              href="/cadastro"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <UserPlus className="size-4" />
              Criar conta gratuita
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Continuar praticando sem salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

