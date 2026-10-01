"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { MOTIVO_JUSTIFICATIVA_LABELS, type StatusJustificativa } from "@/lib/types";

export interface JustificativaLinha {
  id: string;
  matriculaId: string;
  encontroId: string;
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

  async function marcarPresenca(l: JustificativaLinha) {
    if (
      !confirm(
        `Marcar ${l.pessoaNome} como presente no encontro de ${new Date(`${l.encontroData}T00:00:00`).toLocaleDateString("pt-BR")}? Isso apaga esta justificativa (deixa de ser falta, não tem mais o que justificar).`
      )
    )
      return;
    setProcessandoId(l.id);
    try {
      await fetch(`/api/encontros/${l.encontroId}/presenca`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: l.matriculaId, presente: true }),
      });
      await fetch(`/api/justificativas/${l.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta justificativa? A falta volta a aparecer sem justificativa (sem mexer na presença).")) return;
    setProcessandoId(id);
    try {
      await fetch(`/api/justificativas/${id}`, { method: "DELETE" });
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
                <div className="flex flex-wrap gap-2 items-center">
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
                  <button
                    onClick={() => marcarPresenca(l)}
                    disabled={processandoId === l.id}
                    className="btn-secondary"
                  >
                    Na verdade esteve presente
                  </button>
                  <button
                    onClick={() => excluir(l.id)}
                    disabled={processandoId === l.id}
                    className="text-xs text-zosa-muted hover:text-danger hover:underline disabled:opacity-50"
                  >
                    Excluir
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
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge label={STATUS_LABELS[l.status]} fg={STATUS_COLORS[l.status].fg} bg={STATUS_COLORS[l.status].bg} />
                  <button
                    onClick={() => marcarPresenca(l)}
                    disabled={processandoId === l.id}
                    className="text-xs text-zosa-teal hover:underline disabled:opacity-50 whitespace-nowrap"
                  >
                    Na verdade esteve presente
                  </button>
                  <button
                    onClick={() => excluir(l.id)}
                    disabled={processandoId === l.id}
                    className="text-xs text-zosa-muted hover:text-danger hover:underline disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
