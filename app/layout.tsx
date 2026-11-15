import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayoutShell } from "@/components/app-layout-shell";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A IA para sua entrevista",
  description:
    "Simule entrevistas técnicas para Tech Lead com IA. Envie o perfil da vaga e seu currículo para treinar perguntas em tempo real e receber feedbacks detalhados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full antialiased", montserrat.className)}
    >
      <body className="min-h-svh">
        <AuthProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
