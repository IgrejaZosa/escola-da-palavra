"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CriarRodadaForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/rodadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, data_inicio: dataInicio, data_fim: dataFim }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao criar rodada.");
        return;
      }
      const rodada = await res.json();
      router.push(`/admin/rodadas/${rodada.id}`);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn-primary">
        + Nova rodada
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="card p-4 space-y-3 max-w-md">
      <div>
        <label className="label" htmlFor="nome">
          Nome da rodada
        </label>
        <input
          id="nome"
          required
          className="input"
          placeholder="Ex: Rodada 2026.2"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="data_inicio">
            Início (1º domingo)
          </label>
          <input
            id="data_inicio"
            type="date"
            required
            className="input"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="data_fim">
            Fim (domingo da prova)
          </label>
          <input
            id="data_fim"
            type="date"
            required
            className="input"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Criando..." : "Criar rodada"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
