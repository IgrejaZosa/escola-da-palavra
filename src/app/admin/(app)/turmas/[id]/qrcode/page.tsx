import { notFound } from "next/navigation";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";

export const dynamic = "force-dynamic";

export default async function TurmaQrCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dados = await buscarDadosTurma(id);
  if (!dados) notFound();

  return (
    <div className="py-8">
      <QrCodeDisplay turmaId={id} titulo={`${dados.curso.nome} — ${dados.turma.horario}`} />
    </div>
  );
}
