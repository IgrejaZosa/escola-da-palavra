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

/** Faz tudo em lote (poucas idas ao banco no total, não uma por linha da
 * planilha) — com centenas de inscrições, um loop com await por pessoa
 * facilmente estoura o tempo limite da function serverless. */
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

  let semCurso = 0;
  let semHorario = 0;
  const validos: { registro: Registro; turmaId: string }[] = [];
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
    validos.push({ registro, turmaId });
  }

  const { data: pessoasExistentes, error: erroPessoas } = await supabase.from("pessoas").select("*");
  if (erroPessoas) return erroJson(erroPessoas.message, 500);
  const pessoaPorNome = new Map((pessoasExistentes ?? []).map((p) => [normalizar(p.nome as string), p]));

  // Cria de uma vez só as pessoas que ainda não existem (deduplicadas por
  // nome normalizado, caso a planilha repita a mesma pessoa em mais de
  // uma linha).
  const novasPorChave = new Map<string, { nome: string; telefone: string | null; email: string | null }>();
  for (const { registro } of validos) {
    const chave = normalizar(registro.nome);
    if (!pessoaPorNome.has(chave) && !novasPorChave.has(chave)) {
      novasPorChave.set(chave, { nome: registro.nome, telefone: registro.telefone, email: registro.email });
    }
  }
  if (novasPorChave.size > 0) {
    const { data: criadas, error } = await supabase
      .from("pessoas")
      .insert([...novasPorChave.values()])
      .select("*");
    if (error) return erroJson(error.message, 500);
    for (const p of criadas ?? []) pessoaPorNome.set(normalizar(p.nome as string), p);
  }

  // Monta as matrículas (deduplicadas por pessoa+turma dentro do próprio
  // lote) e insere tudo numa única chamada, ignorando quem já estava
  // matriculado (unique(pessoa_id, turma_id) via upsert + DO NOTHING).
  const chavesVistas = new Set<string>();
  const matriculas: { pessoa_id: string; turma_id: string; rodada_id: string }[] = [];
  for (const { registro, turmaId } of validos) {
    const pessoa = pessoaPorNome.get(normalizar(registro.nome));
    if (!pessoa) continue;
    const chave = `${pessoa.id}|${turmaId}`;
    if (chavesVistas.has(chave)) continue;
    chavesVistas.add(chave);
    matriculas.push({ pessoa_id: pessoa.id, turma_id: turmaId, rodada_id: rodadaId });
  }

  let criadas = 0;
  if (matriculas.length > 0) {
    const { data, error } = await supabase
      .from("matriculas")
      .upsert(matriculas, { onConflict: "pessoa_id,turma_id", ignoreDuplicates: true })
      .select("id");
    if (error) return erroJson(error.message, 500);
    criadas = data?.length ?? 0;
  }
  const jaExistiam = matriculas.length - criadas;

  return NextResponse.json({ criadas, jaExistiam, semCurso, semHorario });
}
