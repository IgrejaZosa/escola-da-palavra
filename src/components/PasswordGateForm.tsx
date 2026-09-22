"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/types";

const CONFIG: Record<Papel, { apiUrl: string; destino: string; titulo: string }> = {
  professor: { apiUrl: "/api/acesso-professor", destino: "/professor/quem-e-voce", titulo: "Área do professor" },
  admin: { apiUrl: "/api/acesso-admin", destino: "/admin/quem-e-voce", titulo: "Área do administrador" },
};

export function PasswordGateForm({ papel }: { papel: Papel }) {
  const router = useRouter();
  const { apiUrl, destino, titulo } = CONFIG[papel];
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Senha incorreta.");
        return;
      }
      router.push(destino);
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="card p-6 space-y-4 w-full max-w-sm">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">{titulo}</h1>
        <p className="text-sm text-zosa-muted">Escola da Palavra</p>
      </div>
      <div>
        <label className="label" htmlFor="senha">
          Senha de acesso
        </label>
        <input
          id="senha"
          type="password"
          required
          autoFocus
          className="input"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <button type="submit" className="btn-primary w-full" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
