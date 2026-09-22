import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImportarInscricoesWizard } from "@/components/ImportarInscricoesWizard";
import type { Curso, Rodada } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ImportarInscricoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const { data: rodada } = await supabase.from("rodadas").select("*").eq("id", id).single();
  if (!rodada) notFound();

  const { data: cursos } = await supabase.from("cursos").select("*").eq("rodada_id", id).order("nome");
  if (!cursos || cursos.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-zosa-ink">Importar inscrições — {(rodada as Rodada).nome}</h1>
        <p className="card p-4 text-sm text-zosa-muted">
          Cadastre pelo menos um curso nesta rodada antes de importar a planilha de inscrições.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Importar inscrições — {(rodada as Rodada).nome}</h1>
        <p className="text-sm text-zosa-muted">
          Suba a planilha de inscrições do Forms e mapeie as colunas — a gente cadastra as pessoas e já matricula
          cada uma no curso e horário que ela escolheu.
        </p>
      </div>
      <ImportarInscricoesWizard rodadaId={id} cursos={(cursos ?? []) as Curso[]} />
    </div>
  );
}
