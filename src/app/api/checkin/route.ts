import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

/** Rota pública (sem login — é o autoatendimento do QR code e da aba do
 * aluno). Trava de domingo: só marca presença/falta se o encontro for
 * exatamente o de hoje — fora do dia da aula, a pessoa só pode justificar
 * (ver /api/justificativas), pra não dar pra "se autodeclarar presente"
 * numa aula de outro dia. Ainda valida que a matrícula pertence à mesma
 * turma do encontro, pra um POST forjado não conseguir puxar alguém de
 * outra turma. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const matriculaId = body.matricula_id as string | undefined;
  const encontroId = body.encontro_id as string | undefined;
  const presente = body.presente === false ? false : true;
  if (!matriculaId || !encontroId) return erroJson("Dados incompletos.");

  const supabase = createServiceClient();

  const { data: encontro } = await supabase.from("encontros").select("*").eq("id", encontroId).single();
  if (!encontro) return erroJson("Encontro não encontrado.", 404);

  const hojeIso = new Date().toISOString().slice(0, 10);
  if (encontro.data !== hojeIso) {
    return erroJson("Presença só pode ser marcada no dia do encontro. Fora do dia, use a opção de justificar falta.", 400);
  }

  const { data: matricula } = await supabase.from("matriculas").select("*").eq("id", matriculaId).single();
  if (!matricula || matricula.turma_id !== encontro.turma_id) {
    return erroJson("Matrícula não pertence a esta turma.", 400);
  }
  if (matricula.status !== "ativo") return erroJson("Matrícula não está ativa.", 400);

  const { data: existente } = await supabase
    .from("presencas")
    .select("*")
    .eq("matricula_id", matriculaId)
    .eq("encontro_id", encontroId)
    .maybeSingle();
  if (existente && existente.presente === presente) return NextResponse.json({ ok: true, jaEstava: true });

  const { error } = await supabase
    .from("presencas")
    .upsert(
      { matricula_id: matriculaId, encontro_id: encontroId, presente, marcado_em: new Date().toISOString() },
      { onConflict: "matricula_id,encontro_id" }
    );
  if (error) return erroJson(error.message, 500);

  return NextResponse.json({ ok: true, jaEstava: false });
}
