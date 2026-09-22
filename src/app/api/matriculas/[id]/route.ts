import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import type { StatusMatricula } from "@/lib/types";

/** "Retirar da turma" não apaga a matrícula (preserva histórico de
 * presença/nota) — só marca status cancelado, o que já tira a pessoa de
 * todas as listas/indicadores (que filtram status = 'ativo'). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status as StatusMatricula | undefined;
  if (!status) return erroJson("status é obrigatório.");

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("matriculas").update({ status }).eq("id", id).select("*").single();
  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
