import { createClient } from "@/lib/supabase/server";
import { JustificativasManager, type JustificativaLinha } from "@/components/JustificativasManager";

export const dynamic = "force-dynamic";

interface LinhaBruta {
  id: string;
  motivo: JustificativaLinha["motivo"];
  status: JustificativaLinha["status"];
  matricula: {
    pessoa: { nome: string };
    turma: { horario: string; curso: { nome: string } };
  };
  encontro: { data: string };
}

export default async function AdminJustificativasPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("justificativas")
    .select("id, motivo, status, matricula:matriculas(pessoa:pessoas(nome), turma:turmas(horario, curso:cursos(nome))), encontro:encontros(data)")
    .order("created_at", { ascending: false })
    .limit(200);

  const linhas: JustificativaLinha[] = ((data ?? []) as unknown as LinhaBruta[]).map((l) => ({
    id: l.id,
    motivo: l.motivo,
    status: l.status,
    pessoaNome: l.matricula.pessoa.nome,
    cursoNome: l.matricula.turma.curso.nome,
    horario: l.matricula.turma.horario,
    encontroData: l.encontro.data,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Justificativas de falta</h1>
        <p className="text-sm text-zosa-muted">Valide os pedidos de justificativa que os alunos enviaram.</p>
      </div>
      <JustificativasManager linhas={linhas} />
    </div>
  );
}
