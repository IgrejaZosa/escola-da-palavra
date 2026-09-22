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
  const [marcando, setMarcando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return pessoas;
    return pessoas.filter((p) => normalizar(p.nome).includes(alvo));
  }, [busca, pessoas]);

  async function marcar(matriculaId: string) {
    setErro(null);
    setMarcando(matriculaId);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: matriculaId, encontro_id: encontroId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao marcar presença.");
        return;
      }
      setMarcadas((s) => new Set(s).add(matriculaId));
    } finally {
      setMarcando(null);
    }
  }

  return (
    <div className="space-y-3">
      <input
        autoFocus
        className="input"
        placeholder="Busque seu nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filtradas.map((p) => {
          const presente = marcadas.has(p.matriculaId);
          return (
            <button
              key={p.matriculaId}
              onClick={() => !presente && marcar(p.matriculaId)}
              disabled={presente || marcando === p.matriculaId}
              className={`w-full text-left card p-3 flex items-center justify-between transition-colors ${
                presente ? "border-ok" : "hover:border-zosa-teal"
              }`}
            >
              <span className="text-sm font-medium text-zosa-ink">{p.nome}</span>
              <span className="text-sm">
                {presente ? "✅ Presença registrada" : marcando === p.matriculaId ? "Marcando..." : "Toque para marcar"}
              </span>
            </button>
          );
        })}
        {filtradas.length === 0 && <p className="text-sm text-zosa-muted px-1">Ninguém encontrado com esse nome.</p>}
      </div>
    </div>
  );
}
