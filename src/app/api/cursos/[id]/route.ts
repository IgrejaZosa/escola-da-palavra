import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

const CAMPOS_PERMITIDOS = ["nome", "descricao", "nota_minima"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (campo in body) patch[campo] = body[campo];
  }
  if (Object.keys(patch).length === 0) return erroJson("Nada para atualizar.");

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("cursos").update(patch).eq("id", id).select("*").single();
  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
