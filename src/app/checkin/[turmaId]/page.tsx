import { notFound } from "next/navigation";
import { LogoBand } from "@/components/LogoBand";
import { CheckinList } from "@/components/CheckinList";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { encontroMaisRelevante } from "@/lib/encontros";

export const dynamic = "force-dynamic";

export default async function CheckinPage({ params }: { params: Promise<{ turmaId: string }> }) {
  const { turmaId } = await params;
  const dados = await buscarDadosTurma(turmaId);
  if (!dados) notFound();

  // Não precisa ser acessado exatamente no dia/horário da aula — a
  // presença marcada aqui conta sempre pro encontro mais recente da
  // turma (o domingo que já aconteceu), não pro dia real do acesso.
  const encontro = encontroMaisRelevante(dados.encontros);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <LogoBand heightClassName="h-14" />
      <div className="w-full flex flex-col items-center px-4 py-8 gap-6">
        <div className="w-full max-w-md space-y-1 text-center">
          <h1 className="text-lg font-semibold text-zosa-ink">{dados.curso.nome}</h1>
          <p className="text-sm text-zosa-muted">Turma das {dados.turma.horario}</p>
        </div>

        {!encontro ? (
          <p className="card p-6 text-sm text-zosa-muted max-w-md text-center">
            Nenhum encontro gerado ainda para esta turma.
          </p>
        ) : (
          <div className="w-full max-w-md space-y-3">
            <p className="text-xs text-zosa-muted text-center">
              Registrando presença do encontro de{" "}
              {new Date(`${encontro.data}T00:00:00`).toLocaleDateString("pt-BR")}
            </p>
            <CheckinList
              encontroId={encontro.id}
              pessoas={dados.matriculas.map((m) => ({
                matriculaId: m.id,
                nome: m.pessoa.nome,
                jaPresente: m.presencas.some((p) => p.encontro_id === encontro.id && p.presente),
              }))}
            />
          </div>
        )}
      </div>
    </main>
  );
}
