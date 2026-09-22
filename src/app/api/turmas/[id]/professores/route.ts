import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const usuarioId = body.usuario_id as string | undefined;
  if (!usuarioId) return erroJson("usuario_id é obrigatório.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("turma_professores").insert({ turma_id: id, usuario_id: usuarioId });
  if (error) return erroJson(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const usuarioId = request.nextUrl.searchParams.get("usuario_id");
  if (!usuarioId) return erroJson("usuario_id é obrigatório.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("turma_professores")
    .delete()
    .eq("turma_id", id)
    .eq("usuario_id", usuarioId);
  if (error) return erroJson(error.message, 500);
  return NextResponse.json({ ok: true });
}
