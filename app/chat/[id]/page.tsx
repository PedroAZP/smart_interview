"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowUp } from "lucide-react";

// ---------------------------------------------------------------------------
// O componente real que usa useParams() fica dentro de <Suspense> no export
// default. Isso permite o prerender em rotas dinâmicas (ex: /chat/[id]).
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";
import { getMessages, replyInterview, sendMessage, type MessageOut } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "model";
  content: string;
};

function toUiMessage(m: MessageOut): Message {
  return { id: String(m.id), role: m.role, content: m.content };
}

// ---------------------------------------------------------------------------
// Wrapper exportado — envolve o conteúdo em <Suspense> para que o prerender
// não bloqueie por causa de useParams() em rota dinâmica não estática.
// ---------------------------------------------------------------------------
export default function ChatPage() {
  return (
    <React.Suspense fallback={<ChatSkeleton />}>
      <ChatContent />
    </React.Suspense>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span className="text-sm text-muted-foreground animate-pulse">
        Carregando entrevista...
      </span>
    </div>
  );
}

function ChatContent() {
  const { id: interviewId } = useParams<{ id: string }>();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const nearBottom = React.useRef(true);

  const canSend = input.trim().length > 0 && !isStreaming && !isLoadingHistory;

  // 1. Carrega o histórico do backend ao montar
  React.useEffect(() => {
    if (!interviewId) return;

    let isCancelled = false;
    const abortController = new AbortController();

    setIsLoadingHistory(true);
    setError(null);

    getMessages(interviewId)
      .then((msgs) => {
        if (isCancelled) return;
        setMessages(msgs.map(toUiMessage));
        setIsLoadingHistory(false);

        // Se a última mensagem for do usuário, significa que a IA ainda precisa responder
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === "user") {
          startInitialReply(abortController.signal);
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setError("Não foi possível carregar a conversa.");
        setIsLoadingHistory(false);
      });

    return () => {
      isCancelled = true;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  // 2. Auto-resize do textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // 3. Rastreia se o usuário está perto do fim
  React.useEffect(() => {
    function onScroll() {
      const distance =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      nearBottom.current = distance < 120;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 4. Scroll automático
  React.useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user" || nearBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Resposta inicial: gera resposta para a mensagem já criada em POST /interviews
  // ---------------------------------------------------------------------------
  async function startInitialReply(signal?: AbortSignal) {
    if (!interviewId) return;
    setIsStreaming(true);
    setError(null);

    const replyId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: replyId, role: "model", content: "" },
    ]);

    try {
      await replyInterview(
        interviewId,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        () => {
          setIsStreaming(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("interviews-changed"));
          }
        },
        signal
      );
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "Erro ao obter resposta.");
      setMessages((prev) => prev.filter((m) => m.id !== replyId));
      setIsStreaming(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Envia nova mensagem do usuário e recebe chunks do modelo
  // ---------------------------------------------------------------------------
  async function submit() {
    if (!canSend) return;
    const text = input.trim();
    setInput("");

    const replyId = crypto.randomUUID();
    // Adiciona a mensagem do usuário e o placeholder com os três pontinhos imediatamente
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: replyId, role: "model", content: "" },
    ]);
    setIsStreaming(true);

    try {
      await sendMessage(
        interviewId,
        text,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        () => {
          setIsStreaming(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("interviews-changed"));
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao obter resposta.");
      setMessages((prev) => prev.filter((m) => m.id !== replyId));
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Lista de mensagens */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 py-6">
        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <span className="text-sm text-muted-foreground animate-pulse">
              Carregando conversa...
            </span>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const isTyping =
            isStreaming && i === messages.length - 1 && m.content === "";

          return (
            <div
              key={m.id}
              className={cn(
                "flex w-full gap-3",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap sm:max-w-[75%]",
                  isUser
                    ? "rounded-br-md bg-muted text-foreground"
                    : "rounded-tl-md border border-border/60 bg-card/60"
                )}
              >
                {isTyping ? (
                  <span
                    className="flex items-center gap-1.5 py-1"
                    aria-label="O Tech Lead está pensando"
                  >
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce motion-reduce:animate-none [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce motion-reduce:animate-none [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce motion-reduce:animate-none" />
                  </span>
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* scroll-mb deixa folga para o campo fixo não cobrir a última mensagem */}
        <div ref={bottomRef} className="scroll-mb-40" />
      </div>

      {/* Campo de envio fixo embaixo */}
      <div className="sticky bottom-0 bg-background pt-2 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-end gap-2 rounded-3xl border border-border/60 bg-card p-2 pl-5 shadow-lg transition focus-within:border-cyan-400/40 focus-within:ring-4 focus-within:ring-cyan-400/10">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Responda ao Tech Lead"
              aria-label="Sua mensagem"
              disabled={isStreaming || isLoadingHistory}
              className="block max-h-[200px] min-h-9 w-full resize-none bg-transparent py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="button"
              aria-label="Enviar mensagem"
              disabled={!canSend}
              onClick={submit}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                canSend
                  ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              <ArrowUp className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
