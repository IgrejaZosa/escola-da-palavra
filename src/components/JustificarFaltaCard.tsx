"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import {
  MOTIVO_JUSTIFICATIVA_LABELS,
  STATUS_JUSTIFICATIVA_COLORS,
  STATUS_JUSTIFICATIVA_LABELS,
  type Encontro,
  type Justificativa,
  type MotivoJustificativa,
} from "@/lib/types";

function formatarData(dataIso: string) {
  return new Date(`${dataIso}T00:00:00`).toLocaleDateString("pt-BR");
}

/** Cartão de autoatendimento pra justificar falta — a pessoa escolhe QUAL
 * domingo que faltou quer justificar (dropdown com as faltas ainda sem
 * justificativa aprovada/pendente) e o motivo, e manda pro admin validar.
 * Pensado pra gente leiga: poucos campos, um botão só, nada de jargão. */
export function JustificarFaltaCard({
  matriculaId,
  faltasJustificaveis,
  justificativas,
  encontrosPorId,
}: {
  matriculaId: string;
  faltasJustificaveis: Encontro[];
  justificativas: Justificativa[];
  encontrosPorId: Map<string, Encontro>;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [encontroId, setEncontroId] = useState(faltasJustificaveis[0]?.id ?? "");
  const [motivo, setMotivo] = useState<MotivoJustificativa>("ministerio");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/justificativas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: matriculaId, encontro_id: encontroId, motivo }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao solicitar justificativa.");
        return;
      }
      setAberto(false);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  const justificativasOrdenadas = [...justificativas].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-zosa-ink text-center">Justificar falta</h2>

      {faltasJustificaveis.length === 0 ? (
        <p className="text-center text-sm text-zosa-muted">Nenhuma falta pendente de justificativa. 🎉</p>
      ) : !aberto ? (
        <button onClick={() => setAberto(true)} className="btn-primary w-full">
          Justificar uma falta
        </button>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <div>
            <label className="label" htmlFor="encontro-justificar">
              Qual aula você faltou?
            </label>
            <select
              id="encontro-justificar"
              className="input"
              value={encontroId}
              onChange={(e) => setEncontroId(e.target.value)}
            >
              {faltasJustificaveis.map((enc) => (
                <option key={enc.id} value={enc.id}>
                  {formatarData(enc.data)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="motivo-justificar">
              Motivo
            </label>
            <select
              id="motivo-justificar"
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
          </div>
          {erro && <p className="text-xs text-danger text-center">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={enviando}>
              {enviando ? "Enviando..." : "Solicitar validação de justificativa"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setAberto(false)} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {justificativasOrdenadas.length > 0 && (
        <div className="pt-2 border-t border-zosa-border space-y-1.5">
          <p className="text-xs font-medium text-zosa-muted">Suas justificativas</p>
          {justificativasOrdenadas.map((j) => {
            const encontro = encontrosPorId.get(j.encontro_id);
            return (
              <div key={j.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zosa-muted whitespace-nowrap">
                  {encontro ? formatarData(encontro.data) : ""} · {MOTIVO_JUSTIFICATIVA_LABELS[j.motivo]}
                </span>
                <Badge
                  label={STATUS_JUSTIFICATIVA_LABELS[j.status]}
                  fg={STATUS_JUSTIFICATIVA_COLORS[j.status].fg}
                  bg={STATUS_JUSTIFICATIVA_COLORS[j.status].bg}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
