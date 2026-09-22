"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Rodada } from "@/lib/types";

export function RodadaActions({ rodada, temCursos }: { rodada: Rodada; temCursos: boolean }) {
  const router = useRouter();
  const [ativando, setAtivando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function ativar() {
    setAtivando(true);
    try {
      await fetch(`/api/rodadas/${rodada.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativa: true }),
      });
      router.refresh();
    } finally {
      setAtivando(false);
    }
  }

  async function gerarEncontros() {
    setGerando(true);
    setMensagem(null);
    try {
      const res = await fetch(`/api/rodadas/${rodada.id}/gerar-encontros`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMensagem(json.erro ?? "Erro ao gerar encontros.");
        return;
      }
      setMensagem(
        json.criados > 0 ? `${json.criados} encontro(s) criado(s).` : "Encontros já estavam todos gerados."
      );
      router.refresh();
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!rodada.ativa && (
        <button onClick={ativar} className="btn-secondary" disabled={ativando}>
          {ativando ? "Ativando..." : "Marcar como rodada ativa"}
        </button>
      )}
      <button onClick={gerarEncontros} className="btn-secondary" disabled={gerando || !temCursos} title={!temCursos ? "Cadastre pelo menos um curso primeiro" : undefined}>
        {gerando ? "Gerando..." : "Gerar encontros (domingos)"}
      </button>
      {mensagem && <span className="text-xs text-zosa-muted">{mensagem}</span>}
    </div>
  );
}
