import { createClient } from "@/lib/supabase/server";

/** Confere se um professor está vinculado a uma turma (via
 * turma_professores) antes de deixar ele ver/editar indicadores ou postar
 * material nela. */
export async function professorTemAcessoATurma(usuarioId: string, turmaId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("turma_professores")
    .select("turma_id")
    .eq("usuario_id", usuarioId)
    .eq("turma_id", turmaId)
    .maybeSingle();
  return !!data;
}
