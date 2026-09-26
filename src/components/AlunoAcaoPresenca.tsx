"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { MOTIVO_JUSTIFICATIVA_LABELS, type Encontro, type Justificativa, type MotivoJustificativa } from "@/lib/types";

const STATUS_JUSTIFICATIVA_LABELS = {
  pendente: "Aguardando validação do admin",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
} as const;

const STATUS_JUSTIFICATIVA_COLORS = {
  pendente: { fg: "var(--color-warn)", bg: "var(--color-warn-bg)" },
  aprovada: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  rejeitada: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
} as const;

export function AlunoAcaoPresenca({
  matriculaId,
  encontro,
  jaPresente,
  justificativa,
}: {
  matriculaId: string;
  encontro: Encontro;
  jaPresente: boolean;
  justificativa: Justificativa | null;
}) {
  const router = useRouter();
  const hojeIso = new Date().toISOString().slice(0, 10);
  const ehHoje = encontro.data === hojeIso;
  const jaAconteceu = encontro.data <= hojeIso;

  const [motivo, setMotivo] = useState<MotivoJustificativa>("ministerio");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function marcar(presente: boolean) {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: matriculaId, encontro_id: encontro.id, presente }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao marcar.");
        return;
      }
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarJustificativa() {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/justificativas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: matriculaId, encontro_id: encontro.id, motivo }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao solicitar justificativa.");
        return;
      }
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  const dataFormatada = new Date(`${encontro.data}T00:00:00`).toLocaleDateString("pt-BR");

  if (!jaAconteceu) {
    return (
      <div className="card p-4 text-center text-sm text-zosa-muted">Próximo encontro: {dataFormatada}</div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <p className="text-sm font-medium text-zosa-ink text-center">Encontro de {dataFormatada}</p>

      {justificativa ? (
        <div className="text-center space-y-1">
          <p className="text-xs text-zosa-muted">{MOTIVO_JUSTIFICATIVA_LABELS[justificativa.motivo]}</p>
          <Badge
            label={STATUS_JUSTIFICATIVA_LABELS[justificativa.status]}
            fg={STATUS_JUSTIFICATIVA_COLORS[justificativa.status].fg}
            bg={STATUS_JUSTIFICATIVA_COLORS[justificativa.status].bg}
          />
        </div>
      ) : ehHoje ? (
        <div className="flex justify-center gap-2">
          <button onClick={() => marcar(true)} disabled={carregando} className={jaPresente ? "btn-primary" : "btn-secondary"}>
            {jaPresente ? "✅ Presente" : "Marcar presença"}
          </button>
          <button onClick={() => marcar(false)} disabled={carregando} className={!jaPresente ? "btn-primary" : "btn-secondary"}>
            {!jaPresente ? "Falta" : "Marcar falta"}
          </button>
        </div>
      ) : jaPresente ? (
        <p className="text-center text-sm text-ok">✅ Presença já registrada nesse dia.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-zosa-muted text-center">
            Hoje não é o dia deste encontro — só dá pra justificar uma falta passada.
          </p>
          <select
            className="input"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoJustificativa)}
          >
            {Object.entries(MOTIVO_JUSTIFICATIVA_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={solicitarJustificativa} disabled={carregando} className="btn-primary w-full">
            {carregando ? "Enviando..." : "Solicitar validação de justificativa"}
          </button>
        </div>
      )}
      {erro && <p className="text-xs text-danger text-center">{erro}</p>}
    </div>
  );
}
