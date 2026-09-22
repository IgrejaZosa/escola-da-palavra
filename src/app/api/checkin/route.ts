import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

/** Rota pública (sem login — é o autoatendimento do QR code). Não exige que
 * o encontro seja "de hoje" de propósito: dá pra acessar o link fora do
 * dia/horário exato da aula (ex: corrigir um esquecimento na segunda) e a
 * presença ainda conta pro encontro certo - quem decide qual encontro é
 * esse é o servidor (`encontroMaisRelevante`, calculado na própria página
 * de check-in), não o cliente. `marcado_em` (default now() no banco)
 * continua guardando o momento real em que a pessoa registrou. Ainda
 * valida que a matrícula pertence à mesma turma do encontro, pra um POST
 * forjado não conseguir puxar alguém de outra turma. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const matriculaId = body.matricula_id as string | undefined;
  const encontroId = body.encontro_id as string | undefined;
  if (!matriculaId || !encontroId) return erroJson("Dados incompletos.");

  const supabase = createServiceClient();

  const { data: encontro } = await supabase.from("encontros").select("*").eq("id", encontroId).single();
  if (!encontro) return erroJson("Encontro não encontrado.", 404);

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
  if (existente) return NextResponse.json({ ok: true, jaEstava: true });

  const { error } = await supabase.from("presencas").insert({ matricula_id: matriculaId, encontro_id: encontroId });
  if (error) return erroJson(error.message, 500);

  return NextResponse.json({ ok: true, jaEstava: false });
}
