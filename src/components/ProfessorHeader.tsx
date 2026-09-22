"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TrocarPessoaButton } from "@/components/TrocarPessoaButton";
import { useProfessorSession } from "@/lib/professor-session";

export function ProfessorHeader() {
  const { usuario } = useProfessorSession();

  return (
    <header className="border-b border-zosa-border bg-white sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/professor" className="shrink-0">
          <Logo heightClassName="h-7" />
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: usuario.cor }}
            title={usuario.nome}
          >
            {usuario.nome.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden sm:block text-sm font-medium text-zosa-ink">{usuario.nome}</span>
          <TrocarPessoaButton papel="professor" />
        </div>
      </div>
    </header>
  );
}
