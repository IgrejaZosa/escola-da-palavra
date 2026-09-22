import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizar } from "@/lib/texto";

export async function GET(request: NextRequest) {
  const nome = request.nextUrl.searchParams.get("nome")?.trim() ?? "";
  if (nome.length < 2) return NextResponse.json([]);

  const supabase = createClient();
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, pessoa:pessoas(nome), turma:turmas(horario, curso:cursos(nome, rodada:rodadas(nome)))")
    .eq("status", "ativo");

  const alvo = normalizar(nome);
  const resultados = (matriculas ?? [])
    .map((m) => {
      const pessoa = m.pessoa as unknown as { nome: string };
      const turma = m.turma as unknown as { horario: string; curso: { nome: string; rodada: { nome: string } } };
      return {
        matriculaId: m.id as string,
        pessoaNome: pessoa?.nome ?? "",
        cursoNome: turma?.curso?.nome ?? "",
        horario: turma?.horario ?? "",
        rodadaNome: turma?.curso?.rodada?.nome ?? "",
      };
    })
    .filter((r) => normalizar(r.pessoaNome).includes(alvo))
    .slice(0, 20);

  return NextResponse.json(resultados);
}
