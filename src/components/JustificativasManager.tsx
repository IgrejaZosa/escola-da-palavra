"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { MOTIVO_JUSTIFICATIVA_LABELS, type StatusJustificativa } from "@/lib/types";

export interface JustificativaLinha {
  id: string;
  motivo: keyof typeof MOTIVO_JUSTIFICATIVA_LABELS;
  status: StatusJustificativa;
  pessoaNome: string;
  cursoNome: string;
  horario: string;
  encontroData: string;
}

const STATUS_COLORS: Record<StatusJustificativa, { fg: string; bg: string }> = {
  pendente: { fg: "var(--color-warn)", bg: "var(--color-warn-bg)" },
  aprovada: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  rejeitada: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

const STATUS_LABELS: Record<StatusJustificativa, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export function JustificativasManager({ linhas }: { linhas: JustificativaLinha[] }) {
  const router = useRouter();
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  async function validar(id: string, status: "aprovada" | "rejeitada") {
    setProcessandoId(id);
    try {
      await fetch(`/api/justificativas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setProcessandoId(null);
    }
  }

  const pendentes = linhas.filter((l) => l.status === "pendente");
  const resolvidas = linhas.filter((l) => l.status !== "pendente");

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zosa-ink">Pendentes de validação ({pendentes.length})</h2>
        {pendentes.length === 0 ? (
          <p className="card p-4 text-sm text-zosa-muted">Nenhuma justificativa pendente.</p>
        ) : (
          <div className="card divide-y divide-zosa-border">
            {pendentes.map((l) => (
              <div key={l.id} className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-zosa-ink">{l.pessoaNome}</p>
                  <p className="text-xs text-zosa-muted">
                    {l.cursoNome} · {l.horario} · encontro de{" "}
                    {new Date(`${l.encontroData}T00:00:00`).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs text-zosa-teal mt-0.5">{MOTIVO_JUSTIFICATIVA_LABELS[l.motivo]}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => validar(l.id, "aprovada")}
                    disabled={processandoId === l.id}
                    className="btn-secondary text-ok border-ok"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => validar(l.id, "rejeitada")}
                    disabled={processandoId === l.id}
                    className="btn-secondary text-danger"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {resolvidas.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zosa-ink">Resolvidas recentemente</h2>
          <div className="card divide-y divide-zosa-border">
            {resolvidas.map((l) => (
              <div key={l.id} className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-zosa-ink">{l.pessoaNome}</p>
                  <p className="text-xs text-zosa-muted">
                    {l.cursoNome} · {l.horario} · {MOTIVO_JUSTIFICATIVA_LABELS[l.motivo]} ·{" "}
                    {new Date(`${l.encontroData}T00:00:00`).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge label={STATUS_LABELS[l.status]} fg={STATUS_COLORS[l.status].fg} bg={STATUS_COLORS[l.status].bg} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
