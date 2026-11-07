"use client";

import * as React from "react";
import { ArrowUp, SquareTerminal } from "lucide-react";

import { cn } from "@/lib/utils";

// Mesmo formato da tabela Message do backend
type Message = {
  id: string;
  role: "user" | "model";
  content: string;
};

// TODO (com backend): ler o id com useParams() e buscar as mensagens da API.
const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "model",
    content:
      "Olá! Vou conduzir a sua entrevista para a vaga de Tech Lead. Para começar: conte um pouco sobre a sua trajetória e o tipo de time que você já liderou.",
  },
  {
    id: "2",
    role: "user",
    content:
      "Trabalho há 8 anos com desenvolvimento, os últimos 3 como líder técnico de um time de 6 pessoas, focado em APIs e integrações.",
  },
  {
    id: "3",
    role: "model",
    content:
      "Boa. Vamos aprofundar em arquitetura. Imagine que o seu time precisa quebrar um monolito em serviços menores, com prazo apertado.\n\nComo você decidiria:\n1. Por onde começar a separação?\n2. Como garantir que o time continue entregando funcionalidades durante a migração?\n3. Quais riscos você levaria para a diretoria antes de começar?",
  },
];

// Respostas falsas, usadas em rodízio. Troque por uma chamada ao FastAPI depois.
const FAKE_REPLIES = [
  "Entendi o seu raciocínio. Um ponto que eu gostaria de explorar melhor: como você mediria se a decisão deu certo depois de algumas semanas? Cite pelo menos duas métricas e explique por que elas importam para o negócio.",
  "Interessante. E se o time discordasse da sua abordagem? Me conte como você conduziria essa conversa sem perder o prazo e sem desmotivar ninguém.",
  "Ótimo. Vamos para o próximo tema: revisão de código. Qual é o seu critério para aprovar ou barrar um pull request, e como você ensina isso para devs menos experientes?",
];

export default function ChatPage() {
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [input, setInput] = React.useState("");

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const nearBottom = React.useRef(true);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const replyIndex = React.useRef(0);

  const canSend = input.trim().length > 0 && !isStreaming;

  // 1. Auto-resize do textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // 2. Guarda se o usuário está perto do fim da página
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

  // 3. Desce a tela: sempre quando o usuário envia, e durante a resposta
  //    só se ele não tiver subido para ler algo
  React.useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user" || nearBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  // 4. Limpa o timer se a página for fechada no meio da resposta
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Esta é a ÚNICA parte que você troca quando ligar o backend.
  function handleSend(text: string) {
    const replyId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: replyId, role: "model", content: "" },
    ]);
    setIsStreaming(true);

    const words =
      FAKE_REPLIES[replyIndex.current++ % FAKE_REPLIES.length].split(" ");
    let tick = 0;
    let shown = 0;

    timerRef.current = setInterval(() => {
      tick++;
      if (tick < 15) return; // ~600ms mostrando os três pontinhos

      shown++;
      const content = words.slice(0, shown).join(" ");
      setMessages((prev) =>
        prev.map((m) => (m.id === replyId ? { ...m, content } : m)),
      );

      if (shown >= words.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setIsStreaming(false);
      }
    }, 40);
  }

  function submit() {
    if (!canSend) return;
    handleSend(input.trim());
    setInput("");
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
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const isTyping =
            isStreaming && i === messages.length - 1 && m.content === "";

          return (
            <div
              key={m.id}
              className={cn(
                "flex w-full gap-3",
                isUser ? "justify-end" : "justify-start",
              )}
            >
              {!isUser && (
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-sky-100">
                  <SquareTerminal className="size-4" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap sm:max-w-[75%]",
                  isUser
                    ? "rounded-br-md bg-muted text-foreground"
                    : "rounded-tl-md border border-border/60 bg-card/60",
                )}
              >
                {isTyping ? (
                  <span
                    className="flex items-center gap-1 py-1.5"
                    aria-label="O Tech Lead está digitando"
                  >
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none"
                        style={{ animationDelay: `${dot * 150}ms` }}
                      />
                    ))}
                  </span>
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}

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
              className="block max-h-[200px] min-h-9 w-full resize-none bg-transparent py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
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
                  : "cursor-not-allowed bg-muted text-muted-foreground",
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
