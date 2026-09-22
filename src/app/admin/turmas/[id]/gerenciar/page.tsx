import { notFound } from "next/navigation";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { GerenciarMatriculas } from "@/components/GerenciarMatriculas";

export const dynamic = "force-dynamic";

export default async function GerenciarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dados = await buscarDadosTurma(id);
  if (!dados) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">
          Gerenciar turma — {dados.curso.nome} ({dados.turma.horario})
        </h1>
        <p className="text-sm text-zosa-muted">Adicionar ou retirar alunos manualmente.</p>
      </div>
      <GerenciarMatriculas turmaId={id} matriculas={dados.matriculas} />
    </div>
  );
}
