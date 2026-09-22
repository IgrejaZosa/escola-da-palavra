import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImportarNotasWizard } from "@/components/ImportarNotasWizard";
import type { Curso } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ImportarNotasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: curso } = await supabase.from("cursos").select("*").eq("id", id).single();
  if (!curso) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Importar notas — {(curso as Curso).nome}</h1>
        <p className="text-sm text-zosa-muted">
          Suba a planilha de notas da prova (Forms). Casamos pelo nome com quem já está matriculado nas turmas
          das 08h e 16h30 deste curso.
        </p>
      </div>
      <ImportarNotasWizard cursoId={id} />
    </div>
  );
}
