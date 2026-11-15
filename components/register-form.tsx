"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { register, loginGoogle } = useAuth();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Inicializa o Google Identity Services se o Client ID estiver presente
  React.useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: { credential: string }) => {
              setIsGoogleLoading(true);
              loginGoogle({ credential: response.credential })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : "Falha ao cadastrar com o Google.");
                })
                .finally(() => setIsGoogleLoading(false));
            },
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [loginGoogle]);

  async function handleGoogleClick() {
    setError(null);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      setError(
        "Chave do Google não configurada. Defina NEXT_PUBLIC_GOOGLE_CLIENT_ID no arquivo .env.local para habilitar o login oficial do Google."
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError("O serviço do Google ainda está carregando. Tente novamente em instantes.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    if (name.trim().length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crie sua conta</CardTitle>
          <CardDescription>
            Comece a simular entrevistas técnicas com IA personalizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  Cadastrar com o Google
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Ou cadastre-se com email
              </FieldSeparator>

              {error && (
                <div
                  className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Pelo menos 6 caracteres"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password">Confirmar senha</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Criando conta...
                    </span>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
                <FieldDescription className="text-center text-xs mt-2">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="font-medium text-cyan-400 underline underline-offset-4 hover:text-cyan-300">
                    Entre aqui
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        Ao criar sua conta, você concorda com nossos{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Termos de Serviço
        </a>{" "}
        e{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Política de Privacidade
        </a>
        .
      </FieldDescription>
    </div>
  );
}

