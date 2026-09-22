import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("usuarios").delete().eq("id", id);
  if (error) return erroJson(error.message, 500);
  return NextResponse.json({ ok: true });
}
