import { createClient } from "@/lib/supabase/server";
import { AlunosManager, type AlunoLinha, type TurmaOpcao } from "@/components/AlunosManager";

export const dynamic = "force-dynamic";

interface PessoaBruta {
  id: string;
  nome: string;
  telefone: string | null;
  matriculas: {
    id: string;
    status: "ativo" | "cancelado" | "transferido";
    turma_id: string;
    turma: { horario: string; curso: { nome: string; rodada: { nome: string } } };
  }[];
}

interface TurmaBruta {
  id: string;
  horario: string;
  curso: { nome: string; rodada: { nome: string; ativa: boolean; data_inicio: string } };
}

export default async function AdminAlunosPage() {
  const supabase = createClient();

  const [{ data: pessoas }, { data: turmas }] = await Promise.all([
    supabase
      .from("pessoas")
      .select("id, nome, telefone, matriculas(id, status, turma_id, turma:turmas(horario, curso:cursos(nome, rodada:rodadas(nome))))")
      .order("nome")
      .limit(5000),
    supabase.from("turmas").select("id, horario, curso:cursos(nome, rodada:rodadas(nome, ativa, data_inicio))"),
  ]);

  const alunos: AlunoLinha[] = ((pessoas ?? []) as unknown as PessoaBruta[]).map((p) => ({
    id: p.id,
    nome: p.nome,
    telefone: p.telefone,
    matriculas: (p.matriculas ?? []).map((m) => ({
      id: m.id,
      status: m.status,
      turmaId: m.turma_id,
      cursoNome: m.turma?.curso?.nome ?? "",
      horario: m.turma?.horario ?? "",
      rodadaNome: m.turma?.curso?.rodada?.nome ?? "",
    })),
  }));

  const opcoes: TurmaOpcao[] = ((turmas ?? []) as unknown as TurmaBruta[])
    .sort((a, b) => {
      if (a.curso.rodada.ativa !== b.curso.rodada.ativa) return a.curso.rodada.ativa ? -1 : 1;
      if (a.curso.rodada.data_inicio !== b.curso.rodada.data_inicio)
        return a.curso.rodada.data_inicio < b.curso.rodada.data_inicio ? 1 : -1;
      return `${a.curso.nome}${a.horario}`.localeCompare(`${b.curso.nome}${b.horario}`);
    })
    .map((t) => ({
      id: t.id,
      label: `${t.curso.nome} · ${t.horario} — ${t.curso.rodada.nome}`,
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Alunos</h1>
        <p className="text-sm text-zosa-muted">
          Veja em quais turmas cada aluno está, adicione a outra turma ou retire/exclua da turma.
        </p>
      </div>
      <AlunosManager alunos={alunos} turmas={opcoes} />
    </div>
  );
}
