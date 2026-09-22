"use client";

import Link from "next/link";
import { useProfessorSession } from "@/lib/professor-session";
import { Badge } from "@/components/Badge";

export default function ProfessorDashboardPage() {
  const { turmas } = useProfessorSession();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-zosa-ink">Minhas turmas</h1>
      {turmas.length === 0 && (
        <p className="card p-6 text-sm text-zosa-muted">
          Você ainda não está vinculado a nenhuma turma. Peça pra um administrador te adicionar em
          Turmas → Professores.
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {turmas.map((t) => (
          <Link
            key={t.id}
            href={`/professor/turmas/${t.id}`}
            className="card p-4 flex items-center justify-between hover:border-zosa-teal transition-colors"
          >
            <div>
              <p className="font-medium text-zosa-ink">{t.curso.nome}</p>
              <p className="text-xs text-zosa-muted">Turma das {t.horario}</p>
            </div>
            <Badge label={t.horario} fg="var(--color-ep-dark)" bg="var(--color-ep-tealbg)" />
          </Link>
        ))}
      </div>
    </div>
  );
}
