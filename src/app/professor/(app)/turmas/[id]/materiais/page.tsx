import { notFound, redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { professorTemAcessoATurma } from "@/lib/acesso-turma";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { createClient } from "@/lib/supabase/server";
import { MateriaisList } from "@/components/MateriaisList";
import { MaterialUploadForm } from "@/components/MaterialUploadForm";
import type { Material } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfessorMateriaisPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="text-lg font-semibold text-zosa-ink">Materiais — {dados.curso.nome}</h1>
        <p className="text-sm text-zosa-muted">
          Vale pras duas turmas do curso (08h e 16h30) — o material é o mesmo pro curso inteiro.
        </p>
      </div>
      <MaterialUploadForm cursoId={dados.curso.id} />
      <MateriaisList materiais={(materiais ?? []) as Material[]} />
    </div>
  );
}
