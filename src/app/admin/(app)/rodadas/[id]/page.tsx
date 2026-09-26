import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CriarCursoForm } from "@/components/CriarCursoForm";
import { RodadaActions } from "@/components/RodadaActions";
import { EditarRodadaForm } from "@/components/EditarRodadaForm";
import { ExcluirCursoButton } from "@/components/ExcluirCursoButton";
import { Badge } from "@/components/Badge";
import type { Curso, Rodada } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRodadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const { data: rodada } = await supabase.from("rodadas").select("*").eq("id", id).single();
  if (!rodada) notFound();

  const { data: cursos } = await supabase.from("cursos").select("*").eq("rodada_id", id).order("nome");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zosa-ink">{(rodada as Rodada).nome}</h1>
            {rodada.ativa && <Badge label="Ativa" fg="var(--color-ok)" bg="var(--color-ok-bg)" />}
          </div>
          <p className="text-sm text-zosa-muted">
            {new Date(`${rodada.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")} até{" "}
            {new Date(`${rodada.data_fim}T00:00:00`).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/rodadas/${id}/importar-inscricoes`} className="btn-secondary">
            Importar inscrições
          </Link>
          <Link href={`/admin/rodadas/${id}/indicadores`} className="btn-secondary">
            Indicadores da rodada
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <RodadaActions rodada={rodada as Rodada} temCursos={(cursos ?? []).length > 0} />
        <EditarRodadaForm rodada={rodada as Rodada} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zosa-ink">Cursos ({(cursos ?? []).length}/3)</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {((cursos ?? []) as Curso[]).map((c) => (
            <Link
              key={c.id}
              href={`/admin/cursos/${c.id}`}
              className="card p-4 hover:border-zosa-teal transition-colors space-y-2"
            >
              <div>
                <p className="font-medium text-zosa-ink">{c.nome}</p>
                <p className="text-xs text-zosa-muted mt-1">Nota mínima: {c.nota_minima.toFixed(1)}</p>
              </div>
              <ExcluirCursoButton cursoId={c.id} cursoNome={c.nome} />
            </Link>
          ))}
        </div>
        <CriarCursoForm rodadaId={id} />
      </section>
    </div>
  );
}
