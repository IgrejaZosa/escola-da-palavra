import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizar } from "@/lib/texto";

/** Matricula manualmente uma pessoa numa turma — cria a pessoa se ainda não
 * existir (casando por nome normalizado), senão reaproveita a existente. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id: turmaId } = await params;
  const body = await request.json().catch(() => ({}));
  const nome = (body.nome as string | undefined)?.trim();
  const telefone = (body.telefone as string | undefined)?.trim() || null;
  const email = (body.email as string | undefined)?.trim() || null;
  if (!nome) return erroJson("Nome é obrigatório.");

  const supabase = createServiceClient();

  const { data: turma } = await supabase.from("turmas").select("*").eq("id", turmaId).single();
  if (!turma) return erroJson("Turma não encontrada.", 404);
  const { data: curso } = await supabase.from("cursos").select("rodada_id").eq("id", turma.curso_id).single();
  if (!curso) return erroJson("Curso não encontrado.", 404);

  const { data: candidatas } = await supabase.from("pessoas").select("*");
  const alvo = normalizar(nome);
  let pessoa = (candidatas ?? []).find((p) => normalizar(p.nome as string) === alvo);

  if (!pessoa) {
    const { data: novaPessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome, telefone, email })
      .select("*")
      .single();
    if (erroPessoa) return erroJson(erroPessoa.message, 500);
    pessoa = novaPessoa;
  }

  const { data: matricula, error } = await supabase
    .from("matriculas")
    .insert({ pessoa_id: pessoa.id, turma_id: turmaId, rodada_id: curso.rodada_id })
    .select("*, pessoa:pessoas(*)")
    .single();
  if (error) return erroJson(error.message, 500);

  return NextResponse.json(matricula);
}
