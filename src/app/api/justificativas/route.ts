import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import type { MotivoJustificativa } from "@/lib/types";

const MOTIVOS_VALIDOS: MotivoJustificativa[] = ["ministerio", "atestado", "trabalho"];

/** Rota pública (autoatendimento — a pessoa solicita, o admin valida
 * depois em /admin/justificativas). Só aceita justificar um encontro que
 * já aconteceu — não faz sentido justificar falta de um domingo futuro. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const matriculaId = body.matricula_id as string | undefined;
  const encontroId = body.encontro_id as string | undefined;
  const motivo = body.motivo as MotivoJustificativa | undefined;
  if (!matriculaId || !encontroId || !motivo) return erroJson("Dados incompletos.");
  if (!MOTIVOS_VALIDOS.includes(motivo)) return erroJson("Motivo inválido.");

  const supabase = createServiceClient();

  const { data: encontro } = await supabase.from("encontros").select("*").eq("id", encontroId).single();
  if (!encontro) return erroJson("Encontro não encontrado.", 404);

  const hojeIso = new Date().toISOString().slice(0, 10);
  if (encontro.data > hojeIso) return erroJson("Não dá pra justificar um encontro que ainda não aconteceu.", 400);

  const { data: matricula } = await supabase.from("matriculas").select("*").eq("id", matriculaId).single();
  if (!matricula || matricula.turma_id !== encontro.turma_id) {
    return erroJson("Matrícula não pertence a esta turma.", 400);
  }

  const { data, error } = await supabase
    .from("justificativas")
    .upsert(
      { matricula_id: matriculaId, encontro_id: encontroId, motivo, status: "pendente" },
      { onConflict: "matricula_id,encontro_id" }
    )
    .select("*")
    .single();
  if (error) return erroJson(error.message, 500);

  return NextResponse.json(data);
}
