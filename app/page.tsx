"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, FileText, Loader2, Plus, SquareTerminal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createInterview } from "@/lib/api";
import { useGuestId } from "@/hooks/use-guest-id";

const USER_NAME = "Pedro";

export default function HomePage() {
  const router = useRouter();
  const guestId = useGuestId();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [value, setValue] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSend = (value.trim().length > 0 || files.length > 0) && !isLoading;

  // Auto-resize do textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  // Limpa o formulário e destrava loading sempre que a página montar ou for revisitada
  React.useEffect(() => {
    setIsLoading(false);
    setValue("");
    setFiles([]);
    setError(null);
  }, []);

  async function handleSubmit() {
    if (!canSend) return;
    const prompt = value.trim();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);

    try {
      const { id } = await createInterview(prompt, { guestId: guestId ?? undefined });
      
      // Notifica a sidebar para carregar o histórico com a nova conversa imediatamente
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("interviews-changed"));
      }

      // Limpa os campos antes de navegar
      setValue("");
      setFiles([]);
      setIsLoading(false);

      router.push(`/chat/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar a entrevista.");
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length) setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Brilho de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_45%_at_50%_48%,rgba(34,211,238,0.10),transparent_70%),radial-gradient(40%_35%_at_30%_60%,rgba(59,91,219,0.12),transparent_75%)]"
      />

      <div className="flex w-full max-w-2xl flex-col items-center">
        {/* Saudação */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sky-100 shadow-sm">
            <SquareTerminal className="size-5" />
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Pronto para a entrevista, {USER_NAME}?
          </h1>
        </div>
        <p className="mt-3 max-w-md text-balance text-center text-sm text-muted-foreground">
          Cole a descrição da vaga e anexe seu currículo. Eu assumo o papel de
          Tech Lead e conduzo a conversa.
        </p>

        {/* Caixa de entrada */}
        <div className="mt-10 w-full rounded-3xl border border-border/60 bg-card/60 shadow-lg backdrop-blur transition focus-within:border-cyan-400/40 focus-within:ring-4 focus-within:ring-cyan-400/10">
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-4 pt-4">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex max-w-full items-center gap-2 rounded-lg border border-border/60 bg-background/60 py-1 pr-1 pl-2 text-xs"
                >
                  <FileText className="size-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${file.name}`}
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="rounded p-0.5 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Descreva a vaga ou diga qual posição quer treinar"
            aria-label="Mensagem para o Tech Lead"
            disabled={isLoading}
            className="block max-h-60 w-full resize-none bg-transparent px-5 pt-5 pb-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />

          <div className="flex items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFiles}
                className="hidden"
              />
              <button
                type="button"
                aria-label="Anexar currículo ou vaga"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:opacity-40"
              >
                <Plus className="size-5" />
              </button>
            </div>

            <button
              type="button"
              aria-label="Iniciar entrevista"
              disabled={!canSend}
              onClick={handleSubmit}
              className={cn(
                "flex size-9 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                canSend
                  ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300 cursor-pointer"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
