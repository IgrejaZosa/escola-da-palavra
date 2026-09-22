import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizar } from "@/lib/texto";
import type { Horario } from "@/lib/types";

interface Registro {
  nome: string;
  telefone: string | null;
  email: string | null;
  curso_id: string | null;
  horario: Horario | null;
}

export async function POST(request: NextRequest) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const body = await request.json().catch(() => ({}));
  const rodadaId = body.rodada_id as string | undefined;
  const registros = body.registros as Registro[] | undefined;
  if (!rodadaId || !Array.isArray(registros)) return erroJson("Dados incompletos.");

  const supabase = createServiceClient();

  const { data: cursos } = await supabase.from("cursos").select("id").eq("rodada_id", rodadaId);
  const cursoIds = (cursos ?? []).map((c) => c.id as string);
  const { data: turmas } = cursoIds.length > 0
    ? await supabase.from("turmas").select("*").in("curso_id", cursoIds)
    : { data: [] };
  const turmaPorCursoEHorario = new Map((turmas ?? []).map((t) => [`${t.curso_id}|${t.horario}`, t.id as string]));

  const { data: pessoasExistentes } = await supabase.from("pessoas").select("*");
  const pessoaPorNome = new Map((pessoasExistentes ?? []).map((p) => [normalizar(p.nome as string), p]));

  let criadas = 0;
  let jaExistiam = 0;
  let semCurso = 0;
  let semHorario = 0;

  for (const registro of registros) {
    if (!registro.curso_id) {
      semCurso++;
      continue;
    }
    if (!registro.horario) {
      semHorario++;
      continue;
    }
    const turmaId = turmaPorCursoEHorario.get(`${registro.curso_id}|${registro.horario}`);
    if (!turmaId) {
      semCurso++;
      continue;
    }

    const chave = normalizar(registro.nome);
    let pessoa = pessoaPorNome.get(chave);
    if (!pessoa) {
      const { data: novaPessoa, error: erroPessoa } = await supabase
        .from("pessoas")
        .insert({ nome: registro.nome, telefone: registro.telefone, email: registro.email })
        .select("*")
        .single();
      if (erroPessoa) continue;
      pessoa = novaPessoa;
      pessoaPorNome.set(chave, pessoa);
    }

    const { error: erroMatricula } = await supabase
      .from("matriculas")
      .insert({ pessoa_id: pessoa.id, turma_id: turmaId, rodada_id: rodadaId });

    if (erroMatricula) {
      // unique(pessoa_id, turma_id) violado = já estava matriculada nessa turma
      jaExistiam++;
    } else {
      criadas++;
    }
  }

  return NextResponse.json({ criadas, jaExistiam, semCurso, semHorario });
}
