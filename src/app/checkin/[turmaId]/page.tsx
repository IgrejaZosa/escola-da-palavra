import { notFound } from "next/navigation";
import { LogoBand } from "@/components/LogoBand";
import { CheckinList } from "@/components/CheckinList";
import { buscarDadosTurma } from "@/lib/dados-turma";

export const dynamic = "force-dynamic";

export default async function CheckinPage({ params }: { params: Promise<{ turmaId: string }> }) {
  const { turmaId } = await params;
  const dados = await buscarDadosTurma(turmaId);
  if (!dados) notFound();

  const hojeIso = new Date().toISOString().slice(0, 10);
  const encontroHoje = dados.encontros.find((e) => e.data === hojeIso);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <LogoBand heightClassName="h-14" />
      <div className="w-full flex flex-col items-center px-4 py-8 gap-6">
        <div className="w-full max-w-md space-y-1 text-center">
          <h1 className="text-lg font-semibold text-zosa-ink">{dados.curso.nome}</h1>
          <p className="text-sm text-zosa-muted">Turma das {dados.turma.horario}</p>
        </div>

        {!encontroHoje ? (
          <p className="card p-6 text-sm text-zosa-muted max-w-md text-center">
            Não há encontro desta turma marcado para hoje.
          </p>
        ) : (
          <div className="w-full max-w-md">
            <CheckinList
              encontroId={encontroHoje.id}
              pessoas={dados.matriculas.map((m) => ({
                matriculaId: m.id,
                nome: m.pessoa.nome,
                jaPresente: m.presencas.some((p) => p.encontro_id === encontroHoje.id && p.presente),
              }))}
            />
          </div>
        )}
      </div>
    </main>
  );
}
