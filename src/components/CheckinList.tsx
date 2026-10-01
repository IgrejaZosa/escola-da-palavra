"use client";

import { useMemo, useState } from "react";
import { normalizar } from "@/lib/texto";

interface PessoaCheckin {
  matriculaId: string;
  nome: string;
  jaPresente: boolean;
}

export function CheckinList({ encontroId, pessoas }: { encontroId: string; pessoas: PessoaCheckin[] }) {
  const [busca, setBusca] = useState("");
  const [marcadas, setMarcadas] = useState<Set<string>>(
    () => new Set(pessoas.filter((p) => p.jaPresente).map((p) => p.matriculaId))
  );
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return pessoas;
    return pessoas.filter((p) => normalizar(p.nome).includes(alvo));
  }, [busca, pessoas]);

  async function marcar(matriculaId: string, presente: boolean) {
    setErro(null);
    setProcessando(matriculaId);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: matriculaId, encontro_id: encontroId, presente }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao marcar presença.");
        return;
      }
      setMarcadas((s) => {
        const novo = new Set(s);
        if (presente) novo.add(matriculaId);
        else novo.delete(matriculaId);
        return novo;
      });
      setConfirmando(null);
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="space-y-3">
      <input
        autoFocus
        className="input"
        placeholder="Busque seu nome..."
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value);
          setConfirmando(null);
        }}
      />
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filtradas.map((p) => {
          const presente = marcadas.has(p.matriculaId);

          if (confirmando === p.matriculaId) {
            return (
              <div key={p.matriculaId} className="card p-3 border-zosa-teal space-y-2">
                <p className="text-sm font-medium text-zosa-ink">
                  {presente ? `Desmarcar presença de ${p.nome}?` : `Confirmar presença de ${p.nome}?`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => marcar(p.matriculaId, !presente)}
                    disabled={processando === p.matriculaId}
                    className="btn-primary flex-1"
                  >
                    {processando === p.matriculaId ? "..." : presente ? "Sim, desmarcar" : "Sim, é essa pessoa"}
                  </button>
                  <button
                    onClick={() => setConfirmando(null)}
                    disabled={processando === p.matriculaId}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={p.matriculaId}
              onClick={() => setConfirmando(p.matriculaId)}
              className={`w-full text-left card p-3 flex items-center justify-between transition-colors ${
                presente ? "border-ok" : "hover:border-zosa-teal"
              }`}
            >
              <span className="text-sm font-medium text-zosa-ink">{p.nome}</span>
              <span className="text-sm">{presente ? "✅ Presente · toque pra desmarcar" : "Toque para marcar"}</span>
            </button>
          );
        })}
        {filtradas.length === 0 && <p className="text-sm text-zosa-muted px-1">Ninguém encontrado com esse nome.</p>}
      </div>
    </div>
  );
}
