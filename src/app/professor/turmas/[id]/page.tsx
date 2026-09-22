import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioAtual } from "@/lib/auth";
import { professorTemAcessoATurma } from "@/lib/acesso-turma";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { createClient } from "@/lib/supabase/server";
import { TurmaIndicadoresTable } from "@/components/TurmaIndicadoresTable";
import { MateriaisList } from "@/components/MateriaisList";
import type { Material } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getUsuarioAtual("professor");
  if (!usuario) redirect("/professor/quem-e-voce");

  const temAcesso = await professorTemAcessoATurma(usuario.id, id);
  if (!temAcesso) notFound();

  const dados = await buscarDadosTurma(id);
  if (!dados) notFound();

  const supabase = createClient();
  const { data: materiais } = await supabase
    .from("materiais")
    .select("*")
    .eq("curso_id", dados.curso.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">{dados.curso.nome}</h1>
        <p className="text-sm text-zosa-muted">Turma das {dados.turma.horario}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zosa-ink">Frequência e notas</h2>
        <TurmaIndicadoresTable dados={dados} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zosa-ink">Materiais</h2>
          <Link href={`/professor/turmas/${id}/materiais`} className="text-sm text-zosa-teal hover:underline">
            Postar material →
          </Link>
        </div>
        <MateriaisList materiais={(materiais ?? []) as Material[]} />
      </section>
    </div>
  );
}
