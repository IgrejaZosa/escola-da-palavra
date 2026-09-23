import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

/** Ajuste manual de presença (admin) — corrige quem esqueceu de marcar no
 * QR code, ou reverte um toque errado. Sempre upsert em cima de
 * unique(matricula_id, encontro_id): marcar falta não apaga a linha, só
 * vira presente=false, pra manter o registro de que foi conferido. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id: encontroId } = await params;
  const body = await request.json().catch(() => ({}));
  const matriculaId = body.matricula_id as string | undefined;
  const presente = body.presente as boolean | undefined;
  if (!matriculaId || typeof presente !== "boolean") return erroJson("Dados incompletos.");

  const supabase = createServiceClient();

  const { data: matricula } = await supabase.from("matriculas").select("turma_id").eq("id", matriculaId).single();
  const { data: encontro } = await supabase.from("encontros").select("turma_id").eq("id", encontroId).single();
  if (!matricula || !encontro || matricula.turma_id !== encontro.turma_id) {
    return erroJson("Matrícula não pertence à turma deste encontro.", 400);
  }

  const { error } = await supabase
    .from("presencas")
    .upsert(
      { matricula_id: matriculaId, encontro_id: encontroId, presente, marcado_em: new Date().toISOString() },
      { onConflict: "matricula_id,encontro_id" }
    );
  if (error) return erroJson(error.message, 500);

  return NextResponse.json({ ok: true });
}
