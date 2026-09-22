"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Papel, Usuario } from "@/lib/types";

const CONFIG: Record<Papel, { apiUrl: string; destino: string }> = {
  professor: { apiUrl: "/api/professor/quem-sou-eu", destino: "/professor" },
  admin: { apiUrl: "/api/admin/quem-sou-eu", destino: "/admin" },
};

export function EscolherUsuarioForm({ usuarios, papel }: { usuarios: Usuario[]; papel: Papel }) {
  const router = useRouter();
  const { apiUrl, destino } = CONFIG[papel];
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(usuario: Usuario) {
    setErro(null);
    setCarregandoId(usuario.id);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao entrar.");
        return;
      }
      router.push(destino);
      router.refresh();
    } finally {
      setCarregandoId(null);
    }
  }

  return (
    <div className="card p-6 space-y-4 w-full max-w-sm">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Quem é você?</h1>
        <p className="text-sm text-zosa-muted">Isso aparece nos materiais que você postar e nas notas que lançar.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {usuarios.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => escolher(u)}
            disabled={carregandoId !== null}
            className="flex items-center gap-2 rounded-lg border border-zosa-border px-3 py-3 text-left hover:border-zosa-teal hover:bg-zosa-cream disabled:opacity-50 transition-colors"
          >
            <span
              className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: u.cor }}
            >
              {u.nome.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-zosa-ink">
              {carregandoId === u.id ? "Entrando..." : u.nome}
            </span>
          </button>
        ))}
      </div>
      {usuarios.length === 0 && (
        <p className="text-xs text-danger">
          Nenhum {papel === "professor" ? "professor" : "administrador"} cadastrado ainda.
        </p>
      )}
      {erro && <p className="text-sm text-danger">{erro}</p>}
    </div>
  );
}
