"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Papel, Usuario } from "@/lib/types";

export function UsuariosManager({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<Papel>("professor");
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, papel }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao adicionar.");
        return;
      }
      setNome("");
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover esta pessoa? Ela vai perder o acesso e os materiais que postou ficam sem autor.")) return;
    setRemovendoId(id);
    try {
      await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRemovendoId(null);
    }
  }

  const professores = usuarios.filter((u) => u.papel === "professor");
  const admins = usuarios.filter((u) => u.papel === "admin");

  return (
    <div className="space-y-6">
      <form onSubmit={adicionar} className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="label" htmlFor="nome">
            Nome
          </label>
          <input id="nome" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="papel">
            Papel
          </label>
          <select id="papel" className="input" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            <option value="professor">Professor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Adicionando..." : "Adicionar"}
        </button>
        {erro && <p className="text-sm text-danger w-full">{erro}</p>}
      </form>

      {([
        ["Professores", professores],
        ["Administradores", admins],
      ] as const).map(([titulo, lista]) => (
        <div key={titulo} className="space-y-2">
          <h2 className="text-sm font-semibold text-zosa-ink">{titulo}</h2>
          {lista.length === 0 ? (
            <p className="text-sm text-zosa-muted">Ninguém cadastrado ainda.</p>
          ) : (
            <div className="card divide-y divide-zosa-border">
              {lista.map((u) => (
                <div key={u.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: u.cor }}
                    >
                      {u.nome.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-sm text-zosa-ink">{u.nome}</span>
                  </div>
                  <button
                    onClick={() => remover(u.id)}
                    disabled={removendoId === u.id}
                    className="text-xs text-danger hover:underline disabled:opacity-50"
                  >
                    {removendoId === u.id ? "Removendo..." : "Remover"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
