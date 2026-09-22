import { buscarDadosTurma } from "@/lib/dados-turma";
import { calcularAprovacao, calcularFrequencia } from "@/lib/frequencia";
import { createClient } from "@/lib/supabase/server";
import type { Curso, Turma } from "@/lib/types";

export interface ResumoCurso {
  curso: Curso;
  totalAtivos: number;
  frequenciaMedia: number | null;
  aprovados: number;
  reprovadosFalta: number;
  reprovadosNota: number;
  aguardandoNota: number;
}

/** Agrega os indicadores de um curso (as duas turmas juntas) num resumo
 * pronto pra comparar lado a lado com os outros cursos da rodada. */
export async function resumirCurso(curso: Curso): Promise<ResumoCurso> {
  const supabase = createClient();
  const { data: turmas } = await supabase.from("turmas").select("*").eq("curso_id", curso.id);
  const dadosPorTurma = await Promise.all(((turmas ?? []) as Turma[]).map((t) => buscarDadosTurma(t.id)));

  const linhas = dadosPorTurma
    .filter((d): d is NonNullable<typeof d> => !!d)
    .flatMap((dados) =>
      dados.matriculas.map((m) => {
        const freq = calcularFrequencia(dados.encontros, m.presencas);
        const aprovacao = calcularAprovacao(freq.faltas, m.nota, curso.nota_minima);
        return { freq, aprovacao };
      })
    );

  const comFrequencia = linhas.filter((l) => l.freq.percentual !== null);
  const frequenciaMedia =
    comFrequencia.length > 0
      ? Math.round((comFrequencia.reduce((s, l) => s + (l.freq.percentual ?? 0), 0) / comFrequencia.length) * 10) / 10
      : null;

  return {
    curso,
    totalAtivos: linhas.length,
    frequenciaMedia,
    aprovados: linhas.filter((l) => l.aprovacao === "aprovado").length,
    reprovadosFalta: linhas.filter((l) => l.aprovacao === "reprovado_falta").length,
    reprovadosNota: linhas.filter((l) => l.aprovacao === "reprovado_nota").length,
    aguardandoNota: linhas.filter((l) => l.aprovacao === "aguardando_nota").length,
  };
}
