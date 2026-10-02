import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

/** Exclui o cadastro do aluno do sistema (e, em cascata, qualquer matrícula
 * dele). Só permitido quando ele não está ativo em nenhuma turma — pra não
 * apagar sem querer alguém que ainda está cursando. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  const supabase = createServiceClient();

  const { count } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("pessoa_id", id)
    .eq("status", "ativo");
  if ((count ?? 0) > 0) return erroJson("Esse aluno ainda está ativo em uma turma. Retire-o da turma antes de excluir.", 409);

  const { error } = await supabase.from("pessoas").delete().eq("id", id);
  if (error) return erroJson(error.message, 500);
  return NextResponse.json({ ok: true });
}
