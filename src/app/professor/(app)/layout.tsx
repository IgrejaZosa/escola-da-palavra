import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfessorSessionProvider } from "@/lib/professor-session";
import { ProfessorHeader } from "@/components/ProfessorHeader";
import type { Curso, TurmaComCurso, Turma } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfessorAppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioAtual("professor");
  if (!usuario) redirect("/professor/quem-e-voce");

  const supabase = createClient();
  const { data: vinculos } = await supabase
    .from("turma_professores")
    .select("turma_id")
    .eq("usuario_id", usuario.id);
  const turmaIds = (vinculos ?? []).map((v) => v.turma_id as string);

  let turmas: TurmaComCurso[] = [];
  if (turmaIds.length > 0) {
    const { data: turmasData } = await supabase.from("turmas").select("*").in("id", turmaIds);
    const cursoIds = [...new Set((turmasData ?? []).map((t) => (t as Turma).curso_id))];
    const { data: cursosData } = await supabase.from("cursos").select("*").in("id", cursoIds);
    const cursosPorId = new Map((cursosData ?? []).map((c) => [c.id, c as Curso]));
    turmas = (turmasData ?? [])
      .map((t) => ({ ...(t as Turma), curso: cursosPorId.get((t as Turma).curso_id)! }))
      .filter((t) => t.curso)
      .sort((a, b) => a.curso.nome.localeCompare(b.curso.nome) || a.horario.localeCompare(b.horario));
  }

  return (
    <ProfessorSessionProvider value={{ usuario, turmas }}>
      <ProfessorHeader />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </ProfessorSessionProvider>
  );
}
