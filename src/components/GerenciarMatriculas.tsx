"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatriculaComDados } from "@/lib/dados-turma";

export function GerenciarMatriculas({ turmaId, matriculas }: { turmaId: string; matriculas: MatriculaComDados[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch(`/api/turmas/${turmaId}/matriculas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao matricular.");
        return;
      }
      setNome("");
      setTelefone("");
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  async function retirar(matriculaId: string) {
    if (!confirm("Retirar esta pessoa da turma? O histórico de presença/nota fica guardado.")) return;
    setRemovendoId(matriculaId);
    try {
      await fetch(`/api/matriculas/${matriculaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" }),
      });
      router.refresh();
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={adicionar} className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="label" htmlFor="nome-pessoa">
            Nome
          </label>
          <input id="nome-pessoa" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="label" htmlFor="telefone-pessoa">
            Telefone (opcional)
          </label>
          <input id="telefone-pessoa" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Adicionando..." : "Adicionar à turma"}
        </button>
        {erro && <p className="text-sm text-danger w-full">{erro}</p>}
      </form>

      <div className="card divide-y divide-zosa-border">
        {matriculas.map((m) => (
          <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-sm text-zosa-ink">{m.pessoa.nome}</span>
            <button
              onClick={() => retirar(m.id)}
              disabled={removendoId === m.id}
              className="text-xs text-danger hover:underline disabled:opacity-50"
            >
              {removendoId === m.id ? "Retirando..." : "Retirar da turma"}
            </button>
          </div>
        ))}
        {matriculas.length === 0 && <p className="px-4 py-3 text-sm text-zosa-muted">Ninguém matriculado ainda.</p>}
      </div>
    </div>
  );
}
