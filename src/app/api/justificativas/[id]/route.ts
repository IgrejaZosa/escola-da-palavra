import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import type { StatusJustificativa } from "@/lib/types";

/** Admin aprova ou rejeita uma justificativa pendente. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { usuario, erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status as StatusJustificativa | undefined;
  if (status !== "aprovada" && status !== "rejeitada") return erroJson("status precisa ser aprovada ou rejeitada.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("justificativas")
    .update({ status, validado_por: usuario.id, validado_em: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return erroJson(error.message, 500);

  return NextResponse.json(data);
}
