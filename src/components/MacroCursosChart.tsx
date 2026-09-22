"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ResumoCurso } from "@/lib/resumo-curso";

export function MacroCursosChart({ resumos }: { resumos: ResumoCurso[] }) {
  const dados = resumos.map((r) => ({
    nome: r.curso.nome,
    Aprovados: r.aprovados,
    "Reprovados (falta)": r.reprovadosFalta,
    "Reprovados (nota)": r.reprovadosNota,
    "Aguardando nota": r.aguardandoNota,
  }));

  return (
    <div className="card p-4" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zosa-border)" />
          <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Aprovados" stackId="a" fill="var(--color-ok)" />
          <Bar dataKey="Aguardando nota" stackId="a" fill="var(--color-zosa-border)" />
          <Bar dataKey="Reprovados (falta)" stackId="a" fill="var(--color-danger)" />
          <Bar dataKey="Reprovados (nota)" stackId="a" fill="var(--color-risco)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
