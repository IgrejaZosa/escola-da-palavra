"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Rodada } from "@/lib/types";

export function EditarRodadaForm({ rodada }: { rodada: Rodada }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(rodada.nome);
  const [dataInicio, setDataInicio] = useState(rodada.data_inicio);
  const [dataFim, setDataFim] = useState(rodada.data_fim);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch(`/api/rodadas/${rodada.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, data_inicio: dataInicio, data_fim: dataFim }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao salvar.");
        return;
      }
      setAberto(false);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn-secondary">
        Editar rodada
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="card p-4 space-y-3 max-w-md">
      <div>
        <label className="label" htmlFor="edit-nome">
          Nome da rodada
        </label>
        <input id="edit-nome" required className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="edit-data-inicio">
            Início (1º domingo)
          </label>
          <input
            id="edit-data-inicio"
            type="date"
            required
            className="input"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="edit-data-fim">
            Fim (domingo da prova)
          </label>
          <input
            id="edit-data-fim"
            type="date"
            required
            className="input"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-zosa-muted">
        Mudar as datas não apaga encontros já gerados — use &quot;Gerar encontros&quot; de novo se precisar criar os
        que faltam.
      </p>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
