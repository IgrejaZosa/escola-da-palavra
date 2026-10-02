import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizar } from "@/lib/texto";

/** Matricula uma pessoa numa turma. Aceita `pessoa_id` (aluno já cadastrado,
 * usado pela aba Alunos) ou `nome` (cria a pessoa se ainda não existir,
 * casando por nome normalizado). Se a pessoa já tinha sido retirada dessa
 * turma, reativa a matrícula antiga (preserva presenças/nota) em vez de
 * falhar por duplicidade. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id: turmaId } = await params;
  const body = await request.json().catch(() => ({}));
  const pessoaId = (body.pessoa_id as string | undefined)?.trim();
  const nome = (body.nome as string | undefined)?.trim();
  const telefone = (body.telefone as string | undefined)?.trim() || null;
  const email = (body.email as string | undefined)?.trim() || null;
  if (!pessoaId && !nome) return erroJson("Nome é obrigatório.");

  const supabase = createServiceClient();

  const { data: turma } = await supabase.from("turmas").select("*").eq("id", turmaId).single();
  if (!turma) return erroJson("Turma não encontrada.", 404);
  const { data: curso } = await supabase.from("cursos").select("rodada_id").eq("id", turma.curso_id).single();
  if (!curso) return erroJson("Curso não encontrado.", 404);

  let pessoa: { id: string } | undefined;
  if (pessoaId) {
    const { data } = await supabase.from("pessoas").select("id").eq("id", pessoaId).single();
    if (!data) return erroJson("Aluno não encontrado.", 404);
    pessoa = data;
  } else {
    const { data: candidatas } = await supabase.from("pessoas").select("*");
    const alvo = normalizar(nome as string);
    pessoa = (candidatas ?? []).find((p) => normalizar(p.nome as string) === alvo);
    if (!pessoa) {
      const { data: novaPessoa, error: erroPessoa } = await supabase
        .from("pessoas")
        .insert({ nome, telefone, email })
        .select("*")
        .single();
      if (erroPessoa) return erroJson(erroPessoa.message, 500);
      pessoa = novaPessoa;
    }
  }
  if (!pessoa) return erroJson("Não foi possível identificar o aluno.", 500);

  const { data: existente } = await supabase
    .from("matriculas")
    .select("*")
    .eq("pessoa_id", pessoa.id)
    .eq("turma_id", turmaId)
    .maybeSingle();

  if (existente) {
    if (existente.status === "ativo") return erroJson("Esse aluno já está nessa turma.", 409);
    const { data: reativada, error } = await supabase
      .from("matriculas")
      .update({ status: "ativo" })
      .eq("id", existente.id)
      .select("*, pessoa:pessoas(*)")
      .single();
    if (error) return erroJson(error.message, 500);
    return NextResponse.json(reativada);
  }

  const { data: matricula, error } = await supabase
    .from("matriculas")
    .insert({ pessoa_id: pessoa.id, turma_id: turmaId, rodada_id: curso.rodada_id })
    .select("*, pessoa:pessoas(*)")
    .single();
  if (error) return erroJson(error.message, 500);

  return NextResponse.json(matricula);
}
