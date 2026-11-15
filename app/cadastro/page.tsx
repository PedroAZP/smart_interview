"use client";

import Link from "next/link";
import { SquareTerminal } from "lucide-react";

import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 self-center font-medium outline-none transition hover:opacity-90"
        >
          <div className="flex size-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sky-100 shadow-sm">
            <SquareTerminal className="size-5" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="truncate text-base font-bold tracking-tight">
              SmartInterview AI
            </span>
            <span className="truncate text-xs font-medium text-muted-foreground -mt-0.5">
              Seu TechLead Pessoal
            </span>
          </div>
        </Link>
        <RegisterForm />
      </div>
    </div>
  );
}

