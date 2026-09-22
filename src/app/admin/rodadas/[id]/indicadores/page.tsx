import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resumirCurso } from "@/lib/resumo-curso";
import { StatCard } from "@/components/StatCard";
import { MacroCursosChart } from "@/components/MacroCursosChart";
import type { Curso, Rodada } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RodadaIndicadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const { data: rodada } = await supabase.from("rodadas").select("*").eq("id", id).single();
  if (!rodada) notFound();

  const { data: cursos } = await supabase.from("cursos").select("*").eq("rodada_id", id).order("nome");
  const resumos = await Promise.all(((cursos ?? []) as Curso[]).map((c) => resumirCurso(c)));

  const totalInscritos = resumos.reduce((s, r) => s + r.totalAtivos, 0);
  const comFrequencia = resumos.filter((r) => r.frequenciaMedia !== null);
  const frequenciaMediaGeral =
    comFrequencia.length > 0
      ? Math.round((comFrequencia.reduce((s, r) => s + (r.frequenciaMedia ?? 0), 0) / comFrequencia.length) * 10) / 10
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Indicadores — {(rodada as Rodada).nome}</h1>
        <p className="text-sm text-zosa-muted">Os 3 cursos da rodada, lado a lado.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total de inscritos" value={totalInscritos} emoji="👥" />
        <StatCard label="Frequência média geral" value={frequenciaMediaGeral !== null ? `${frequenciaMediaGeral}%` : "—"} emoji="📊" />
        <StatCard label="Cursos na rodada" value={resumos.length} emoji="📚" />
      </div>

      {resumos.length > 0 && <MacroCursosChart resumos={resumos} />}

      <div className="grid sm:grid-cols-3 gap-3">
        {resumos.map((r) => (
          <div key={r.curso.id} className="card p-4 space-y-2">
            <p className="font-medium text-zosa-ink">{r.curso.nome}</p>
            <p className="text-xs text-zosa-muted">{r.totalAtivos} inscritos · frequência média {r.frequenciaMedia !== null ? `${r.frequenciaMedia}%` : "—"}</p>
            <div className="text-xs text-zosa-muted space-y-0.5">
              <p>✅ Aprovados: {r.aprovados}</p>
              <p>⏳ Aguardando nota: {r.aguardandoNota}</p>
              <p>⛔ Reprovados por falta: {r.reprovadosFalta}</p>
              <p>⛔ Reprovados por nota: {r.reprovadosNota}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
