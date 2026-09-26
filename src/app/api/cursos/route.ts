import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { HORARIOS } from "@/lib/types";

/** Cria um curso e já monta as duas turmas dele (08h e 16h30) — na Escola
 * da Palavra todo curso acontece nos dois horários, não existe curso sem
 * uma das turmas. */
export async function POST(request: NextRequest) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const body = await request.json().catch(() => ({}));
  const rodadaId = body.rodada_id as string | undefined;
  const nome = (body.nome as string | undefined)?.trim();
  const descricao = (body.descricao as string | undefined)?.trim() || null;
  const notaMinima = body.nota_minima !== undefined ? Number(body.nota_minima) : 60;
  if (!rodadaId || !nome) return erroJson("Rodada e nome são obrigatórios.");
  if (Number.isNaN(notaMinima) || notaMinima < 0 || notaMinima > 100) return erroJson("Nota mínima inválida.");

  const supabase = createServiceClient();
  const { data: curso, error } = await supabase
    .from("cursos")
    .insert({ rodada_id: rodadaId, nome, descricao, nota_minima: notaMinima })
    .select("*")
    .single();
  if (error) return erroJson(error.message, 500);

  const { error: erroTurmas } = await supabase
    .from("turmas")
    .insert(HORARIOS.map((horario) => ({ curso_id: curso.id, horario })));
  if (erroTurmas) return erroJson(erroTurmas.message, 500);

  return NextResponse.json(curso);
}
