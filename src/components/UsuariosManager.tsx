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
    <div className="space-y-8">
      <form onSubmit={adicionar} className="card p-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="nome">
            Nome
          </label>
          <input id="nome" className="input text-base py-2.5" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="papel">
            Papel
          </label>
          <select id="papel" className="input text-base py-2.5" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            <option value="professor">Professor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button type="submit" className="btn-primary text-base px-6 py-2.5" disabled={salvando}>
          {salvando ? "Adicionando..." : "Adicionar"}
        </button>
        {erro && <p className="text-sm text-danger w-full">{erro}</p>}
      </form>

      {([
        ["Professores", professores],
        ["Administradores", admins],
      ] as const).map(([titulo, lista]) => (
        <div key={titulo} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ep-teal">{titulo}</h2>
          {lista.length === 0 ? (
            <p className="text-sm text-zosa-muted">Ninguém cadastrado ainda.</p>
          ) : (
            <div className="card divide-y divide-zosa-border">
              {lista.map((u) => (
                <div key={u.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{ backgroundColor: u.cor }}
                    >
                      {u.nome.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-base text-zosa-ink">{u.nome}</span>
                  </div>
                  <button
                    onClick={() => remover(u.id)}
                    disabled={removendoId === u.id}
                    className="text-sm text-danger hover:underline disabled:opacity-50"
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
