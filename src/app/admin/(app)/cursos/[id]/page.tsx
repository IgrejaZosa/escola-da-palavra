import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { TurmaGerenciavel } from "@/components/TurmaGerenciavel";
import { TurmaProfessoresManager } from "@/components/TurmaProfessoresManager";
import { MateriaisList } from "@/components/MateriaisList";
import { MaterialUploadForm } from "@/components/MaterialUploadForm";
import type { Curso, Material, Turma, Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const { data: curso } = await supabase.from("cursos").select("*").eq("id", id).single();
  if (!curso) notFound();

  const [{ data: turmas }, { data: professores }, { data: materiais }] = await Promise.all([
    supabase.from("turmas").select("*").eq("curso_id", id).order("horario"),
    supabase.from("usuarios").select("*").eq("papel", "professor").order("nome"),
    supabase.from("materiais").select("*").eq("curso_id", id).order("created_at", { ascending: false }),
  ]);

  const turmaIds = ((turmas ?? []) as Turma[]).map((t) => t.id);
  const { data: vinculos } =
    turmaIds.length > 0
      ? await supabase.from("turma_professores").select("turma_id, usuario_id").in("turma_id", turmaIds)
      : { data: [] as { turma_id: string; usuario_id: string }[] };

  const professoresPorId = new Map(((professores ?? []) as Usuario[]).map((p) => [p.id, p]));
  const dadosPorTurma = await Promise.all(((turmas ?? []) as Turma[]).map((t) => buscarDadosTurma(t.id)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-zosa-ink">{(curso as Curso).nome}</h1>
          <p className="text-sm text-zosa-muted">Nota mínima de aprovação: {(curso as Curso).nota_minima.toFixed(1)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/cursos/${id}/importar-notas`} className="btn-secondary">
            Importar notas da prova
          </Link>
          <Link href={`/admin/cursos/${id}/indicadores`} className="btn-secondary">
            Indicadores do curso
          </Link>
        </div>
      </div>

      {dadosPorTurma.map((dados, i) => {
        if (!dados) return null;
        const turma = ((turmas ?? []) as Turma[])[i];
        const atribuidos = (vinculos ?? [])
          .filter((v) => v.turma_id === turma.id)
          .map((v) => professoresPorId.get(v.usuario_id))
          .filter((p): p is Usuario => !!p);

        return (
          <section key={turma.id} className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-zosa-ink">Turma das {turma.horario}</h2>
              <div className="flex gap-2">
                <Link href={`/admin/turmas/${turma.id}/qrcode`} className="text-sm text-zosa-teal hover:underline">
                  QR code de presença
                </Link>
              </div>
            </div>
            <TurmaProfessoresManager turmaId={turma.id} atribuidos={atribuidos} todosProfessores={(professores ?? []) as Usuario[]} />
            <TurmaGerenciavel turmaId={turma.id} dados={dados} />
          </section>
        );
      })}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zosa-ink">Materiais do curso</h2>
        <MaterialUploadForm cursoId={id} />
        <MateriaisList materiais={(materiais ?? []) as Material[]} />
      </section>
    </div>
  );
}
