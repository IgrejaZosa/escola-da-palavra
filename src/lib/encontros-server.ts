import { createServiceClient } from "@/lib/supabase/server";
import { domingosEntre } from "@/lib/encontros";

/** Gera (ou completa) os encontros de todas as turmas dos cursos de uma
 * rodada: um por domingo entre data_inicio e data_fim. Idempotente — só
 * insere os domingos que ainda não existem pra cada turma, então pode ser
 * chamado de novo com segurança se a rodada ganhar mais cursos/turmas
 * depois ou se a data_fim for esticada. */
export async function gerarEncontros(rodadaId: string): Promise<{ criados: number }> {
  const supabase = createServiceClient();

  const { data: rodada, error: erroRodada } = await supabase
    .from("rodadas")
    .select("*")
    .eq("id", rodadaId)
    .single();
  if (erroRodada || !rodada) throw new Error(erroRodada?.message ?? "Rodada não encontrada.");

  const { data: cursos } = await supabase.from("cursos").select("id").eq("rodada_id", rodadaId);
  const cursoIds = (cursos ?? []).map((c) => c.id as string);
  if (cursoIds.length === 0) return { criados: 0 };

  const { data: turmas } = await supabase.from("turmas").select("id").in("curso_id", cursoIds);
  const turmaIds = (turmas ?? []).map((t) => t.id as string);
  if (turmaIds.length === 0) return { criados: 0 };

  const datas = domingosEntre(rodada.data_inicio, rodada.data_fim);

  const { data: existentes } = await supabase
    .from("encontros")
    .select("turma_id, data")
    .in("turma_id", turmaIds);
  const jaExiste = new Set((existentes ?? []).map((e) => `${e.turma_id}|${e.data}`));

  const novos = turmaIds.flatMap((turmaId) =>
    datas
      .filter((data) => !jaExiste.has(`${turmaId}|${data}`))
      .map((data) => ({
        turma_id: turmaId,
        data,
        numero: datas.indexOf(data) + 1,
      }))
  );

  if (novos.length === 0) return { criados: 0 };

  const { error } = await supabase.from("encontros").insert(novos);
  if (error) throw new Error(error.message);
  return { criados: novos.length };
}
