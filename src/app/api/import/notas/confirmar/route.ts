import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizar } from "@/lib/texto";

interface Registro {
  nome: string;
  nota: number;
}

/** Lança todas as notas numa única chamada ao banco (upsert por id) em vez
 * de um UPDATE por linha — com uma turma inteira de notas, um loop com
 * await por pessoa pode estourar o tempo limite da function serverless. */
export async function POST(request: NextRequest) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const body = await request.json().catch(() => ({}));
  const cursoId = body.curso_id as string | undefined;
  const registros = body.registros as Registro[] | undefined;
  if (!cursoId || !Array.isArray(registros)) return erroJson("Dados incompletos.");

  const supabase = createServiceClient();

  const { data: turmas } = await supabase.from("turmas").select("id").eq("curso_id", cursoId);
  const turmaIds = (turmas ?? []).map((t) => t.id as string);
  const { data: matriculas } =
    turmaIds.length > 0
      ? await supabase.from("matriculas").select("*, pessoa:pessoas(*)").in("turma_id", turmaIds).eq("status", "ativo")
      : { data: [] };

  const matriculaPorNome = new Map(
    (matriculas ?? []).map((m) => [normalizar((m as unknown as { pessoa: { nome: string } }).pessoa.nome), m.id as string])
  );

  const naoEncontradas: string[] = [];
  const atualizacoes: { id: string; nota: number }[] = [];
  for (const registro of registros) {
    const matriculaId = matriculaPorNome.get(normalizar(registro.nome));
    if (!matriculaId) {
      naoEncontradas.push(registro.nome);
      continue;
    }
    atualizacoes.push({ id: matriculaId, nota: registro.nota });
  }

  let atualizadas = 0;
  if (atualizacoes.length > 0) {
    const { data, error } = await supabase.from("matriculas").upsert(atualizacoes, { onConflict: "id" }).select("id");
    if (error) return erroJson(error.message, 500);
    atualizadas = data?.length ?? 0;
  }

  return NextResponse.json({ atualizadas, naoEncontradas });
}
