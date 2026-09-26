import { notFound } from "next/navigation";
import { LogoBand } from "@/components/LogoBand";
import { CheckinFiltroHorario, type SecaoCheckin } from "@/components/CheckinFiltroHorario";
import { createClient } from "@/lib/supabase/server";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { encontroMaisRelevante } from "@/lib/encontros";
import type { Curso, Turma } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CheckinCursoPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params;
  const supabase = createClient();

  const { data: curso } = await supabase.from("cursos").select("*").eq("id", cursoId).single();
  if (!curso) notFound();

  const { data: turmas } = await supabase.from("turmas").select("*").eq("curso_id", cursoId).order("horario");
  const dadosPorTurma = await Promise.all(((turmas ?? []) as Turma[]).map((t) => buscarDadosTurma(t.id)));

  const hojeIso = new Date().toISOString().slice(0, 10);
  const secoes: SecaoCheckin[] = dadosPorTurma
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((dados) => {
      const encontro = encontroMaisRelevante(dados.encontros);
      return {
        turmaId: dados.turma.id,
        horario: dados.turma.horario,
        encontroId: encontro?.id ?? null,
        encontroData: encontro?.data ?? null,
        ehHoje: encontro?.data === hojeIso,
        pessoas: dados.matriculas.map((m) => ({
          matriculaId: m.id,
          nome: m.pessoa.nome,
          jaPresente: encontro ? m.presencas.some((p) => p.encontro_id === encontro.id && p.presente) : false,
        })),
      };
    });

  return (
    <main className="min-h-screen flex flex-col items-center">
      <LogoBand heightClassName="h-14" />
      <div className="w-full flex flex-col items-center px-4 py-8 gap-6">
        <h1 className="text-lg font-semibold text-zosa-ink">{(curso as Curso).nome}</h1>
        <CheckinFiltroHorario secoes={secoes} />
      </div>
    </main>
  );
}
