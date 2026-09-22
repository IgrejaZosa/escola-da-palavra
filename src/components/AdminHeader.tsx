"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { TrocarPessoaButton } from "@/components/TrocarPessoaButton";
import { useAdminSession } from "@/lib/admin-session";

const NAV = [
  { href: "/admin/rodadas", label: "Rodadas" },
  { href: "/admin/usuarios", label: "Professores e admins" },
];

export function AdminHeader() {
  const pathname = usePathname();
  const { usuario } = useAdminSession();

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-ep-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="shrink-0">
            <Logo heightClassName="h-12" variant="white" />
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: usuario.cor }}
              title={usuario.nome}
            >
              {usuario.nome.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:block text-sm font-medium text-white">{usuario.nome}</span>
            <TrocarPessoaButton papel="admin" />
          </div>
        </div>
      </div>
      <div className="border-b border-zosa-border bg-white">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-1">
          {NAV.map((item) => {
            const ativo = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  ativo ? "bg-zosa-dark text-white" : "text-zosa-muted hover:bg-zosa-cream hover:text-zosa-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
