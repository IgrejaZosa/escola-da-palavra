"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckinList } from "@/components/CheckinList";
import type { Horario } from "@/lib/types";

export interface SecaoCheckin {
  turmaId: string;
  horario: Horario;
  encontroId: string | null;
  ehHoje: boolean;
  encontroData: string | null;
  pessoas: { matriculaId: string; nome: string; jaPresente: boolean }[];
}

const FILTROS = ["todos", "08h", "16h30"] as const;
type Filtro = (typeof FILTROS)[number];

export function CheckinFiltroHorario({ secoes }: { secoes: SecaoCheckin[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visiveis = secoes.filter((s) => filtro === "todos" || s.horario === filtro);

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex justify-center gap-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === f ? "bg-zosa-dark text-white" : "bg-white text-zosa-muted border border-zosa-border"
            }`}
          >
            {f === "todos" ? "Todos" : f}
          </button>
        ))}
      </div>

      {visiveis.map((s) => (
        <div key={s.turmaId} className="space-y-2">
          <p className="text-sm font-medium text-zosa-ink">Turma das {s.horario}</p>
          {!s.encontroId ? (
            <p className="card p-4 text-sm text-zosa-muted">Nenhum encontro gerado ainda.</p>
          ) : s.ehHoje ? (
            <CheckinList encontroId={s.encontroId} pessoas={s.pessoas} />
          ) : (
            <div className="card p-4 text-sm text-zosa-muted space-y-2">
              <p>
                Hoje não é o dia deste encontro
                {s.encontroData
                  ? ` (encontro mais recente: ${new Date(`${s.encontroData}T00:00:00`).toLocaleDateString("pt-BR")})`
                  : ""}
                . Presença só pode ser marcada no domingo da aula.
              </p>
              <p>
                Se você faltou, acesse a{" "}
                <Link href="/aluno" className="text-zosa-teal hover:underline">
                  área do aluno
                </Link>{" "}
                pra justificar.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
