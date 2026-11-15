/** Cliente centralizado para a API do SmartInterview backend. */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type MessageRole = "user" | "model";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MessageOut {
  id: number;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface InterviewSummary {
  id: string;
  title: string;
  created_at: string;
}

export interface CreateInterviewResponse {
  id: string;
  title: string;
}

export interface ReportItemOut {
  id: number;
  kind: "strength" | "blind_spot" | "improvement";
  topic?: string | null;
  description: string;
  sort_order: number;
}

export interface ReportOut {
  id: number;
  interview_id: string;
  score: number;
  score_technical: number;
  score_communication: number;
  score_alignment: number;
  summary: string;
  created_at: string;
  items: ReportItemOut[];
}

// ---------------------------------------------------------------------------
// Autenticação (Login, Cadastro e Google)
// ---------------------------------------------------------------------------
export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao realizar login.");
  }
  return res.json();
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao realizar cadastro.");
  }
  return res.json();
}

export async function loginWithGoogle(data: {
  credential?: string;
  email?: string;
  name?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao autenticar com o Google.");
  }
  return res.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Sessão expirada ou inválida.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Cria uma nova entrevista e retorna { id, title }
// ---------------------------------------------------------------------------
export async function createInterview(
  message: string,
  options?: {
    jobDescription?: string;
    resumeText?: string;
    guestId?: string;
    userId?: number;
  }
): Promise<CreateInterviewResponse> {
  const res = await fetch(`${API_BASE}/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      job_description: options?.jobDescription ?? null,
      resume_text: options?.resumeText ?? null,
      guest_id: options?.guestId ?? null,
      user_id: options?.userId ?? null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao criar entrevista.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Busca o histórico de mensagens de uma entrevista
// ---------------------------------------------------------------------------
export async function getMessages(interviewId: string): Promise<MessageOut[]> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/messages`);
  if (!res.ok) throw new Error("Entrevista não encontrada.");
  return res.json();
}

// ---------------------------------------------------------------------------
// Lista entrevistas (histórico da sidebar)
// ---------------------------------------------------------------------------
export async function listInterviews(
  guestId?: string,
  userId?: number
): Promise<InterviewSummary[]> {
  let url = `${API_BASE}/interviews`;
  const params = new URLSearchParams();
  if (userId) {
    params.set("user_id", String(userId));
  } else if (guestId) {
    params.set("guest_id", guestId);
  }
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar histórico.");
  return res.json();
}

// ---------------------------------------------------------------------------
// Consome stream SSE genérico
// ---------------------------------------------------------------------------
async function consumeSSE(
  res: Response,
  onChunk: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Stream indisponível.");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as {
            chunk?: string;
            done?: boolean;
            error?: string;
          };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.chunk) onChunk(parsed.chunk);
          if (parsed.done) onDone();
        } catch (e) {
          if (e instanceof Error && raw.includes('"error"')) {
            throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Gera resposta para a última mensagem existente na entrevista (ex: primeira mensagem)
// NÃO salva uma nova mensagem de usuário no banco
// ---------------------------------------------------------------------------
export async function replyInterview(
  interviewId: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao obter resposta.");
  }

  await consumeSSE(res, onChunk, onDone);
}

// ---------------------------------------------------------------------------
// Envia uma nova mensagem do usuário e faz streaming da resposta via SSE
// onChunk é chamado a cada fragmento de texto recebido
// onDone é chamado ao final
// ---------------------------------------------------------------------------
export async function sendMessage(
  interviewId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao enviar mensagem.");
  }

  await consumeSSE(res, onChunk, onDone);
}

// ---------------------------------------------------------------------------
// Relatórios de Análise (Apenas usuários autenticados)
// ---------------------------------------------------------------------------
export async function generateReport(
  interviewId: string,
  token: string
): Promise<ReportOut> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/report`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao gerar relatório da entrevista.");
  }
  return res.json();
}

export async function getReport(
  interviewId: string,
  token: string
): Promise<ReportOut> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/report`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao obter relatório.");
  }
  return res.json();
}

export async function listUserReports(token: string): Promise<ReportOut[]> {
  const res = await fetch(`${API_BASE}/interviews/reports/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? "Erro ao carregar diagnósticos.");
  }
  return res.json();
}


