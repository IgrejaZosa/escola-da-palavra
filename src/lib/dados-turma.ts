import { createClient } from "@/lib/supabase/server";
import type { Curso, Encontro, Matricula, Pessoa, Presenca, Turma } from "@/lib/types";

export interface MatriculaComDados extends Matricula {
  pessoa: Pessoa;
  presencas: Presenca[];
}

export interface DadosTurma {
  turma: Turma;
  curso: Curso;
  encontros: Encontro[];
  matriculas: MatriculaComDados[];
}

/** Busca tudo que as telas de indicadores/checkin de uma turma precisam,
 * num único lugar — evita duplicar a mesma sequência de queries entre a
 * tela do admin e a do professor (que mostram exatamente os mesmos dados,
 * só que com escopos de acesso diferentes). */
export async function buscarDadosTurma(turmaId: string): Promise<DadosTurma | null> {
  const supabase = createClient();

  const { data: turma } = await supabase.from("turmas").select("*").eq("id", turmaId).single();
  if (!turma) return null;

  const { data: curso } = await supabase.from("cursos").select("*").eq("id", turma.curso_id).single();
  if (!curso) return null;

  const [{ data: encontros }, { data: matriculasRaw }] = await Promise.all([
    supabase.from("encontros").select("*").eq("turma_id", turmaId).order("data"),
    supabase.from("matriculas").select("*, pessoa:pessoas(*)").eq("turma_id", turmaId).eq("status", "ativo"),
  ]);

  const matriculaIds = (matriculasRaw ?? []).map((m) => m.id as string);
  const { data: presencas } =
    matriculaIds.length > 0
      ? await supabase.from("presencas").select("*").in("matricula_id", matriculaIds)
      : { data: [] as Presenca[] };

  const presencasPorMatricula = new Map<string, Presenca[]>();
  for (const p of presencas ?? []) {
    const lista = presencasPorMatricula.get(p.matricula_id) ?? [];
    lista.push(p as Presenca);
    presencasPorMatricula.set(p.matricula_id, lista);
  }

  const matriculas: MatriculaComDados[] = (matriculasRaw ?? []).map((m) => ({
    ...(m as Matricula),
    pessoa: (m as unknown as { pessoa: Pessoa }).pessoa,
    presencas: presencasPorMatricula.get(m.id as string) ?? [],
  }));
  matriculas.sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome));

  return {
    turma: turma as Turma,
    curso: curso as Curso,
    encontros: (encontros ?? []) as Encontro[],
    matriculas,
  };
}
