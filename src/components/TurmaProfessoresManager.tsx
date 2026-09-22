"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/lib/types";

export function TurmaProfessoresManager({
  turmaId,
  atribuidos,
  todosProfessores,
}: {
  turmaId: string;
  atribuidos: Usuario[];
  todosProfessores: Usuario[];
}) {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState("");
  const [salvando, setSalvando] = useState(false);

  const disponiveis = todosProfessores.filter((p) => !atribuidos.some((a) => a.id === p.id));

  async function adicionar() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      await fetch(`/api/turmas/${turmaId}/professores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: selecionado }),
      });
      setSelecionado("");
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  async function remover(usuarioId: string) {
    setSalvando(true);
    try {
      await fetch(`/api/turmas/${turmaId}/professores?usuario_id=${usuarioId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {atribuidos.map((p) => (
          <span key={p.id} className="badge bg-zosa-cream text-zosa-ink border border-zosa-border">
            {p.nome}
            <button onClick={() => remover(p.id)} disabled={salvando} className="ml-1 text-zosa-muted hover:text-danger">
              ×
            </button>
          </span>
        ))}
        {atribuidos.length === 0 && <span className="text-xs text-zosa-muted">Nenhum professor vinculado.</span>}
      </div>
      {disponiveis.length > 0 && (
        <div className="flex gap-2">
          <select className="input" value={selecionado} onChange={(e) => setSelecionado(e.target.value)}>
            <option value="">Adicionar professor...</option>
            {disponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <button onClick={adicionar} disabled={!selecionado || salvando} className="btn-secondary">
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
