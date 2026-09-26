import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoBand } from "@/components/LogoBand";
import { Badge } from "@/components/Badge";
import { MateriaisList } from "@/components/MateriaisList";
import { JustificarFaltaCard } from "@/components/JustificarFaltaCard";
import {
  calcularAprovacao,
  calcularFrequencia,
  STATUS_APROVACAO_COLORS,
  STATUS_APROVACAO_LABELS,
  STATUS_FREQUENCIA_COLORS,
  STATUS_FREQUENCIA_LABELS,
} from "@/lib/frequencia";
import type { Curso, Encontro, Justificativa, Material, Pessoa, Presenca, Turma } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AlunoDashboardPage({ params }: { params: Promise<{ matriculaId: string }> }) {
  const { matriculaId } = await params;
  const supabase = createClient();

  const { data: matricula } = await supabase.from("matriculas").select("*, pessoa:pessoas(*)").eq("id", matriculaId).single();
  if (!matricula) notFound();

  const pessoa = matricula.pessoa as unknown as Pessoa;
  const { data: turma } = await supabase.from("turmas").select("*").eq("id", matricula.turma_id).single();
  if (!turma) notFound();
  const { data: curso } = await supabase.from("cursos").select("*").eq("id", (turma as Turma).curso_id).single();
  if (!curso) notFound();

  const [{ data: encontros }, { data: presencas }, { data: justificativas }, { data: materiais }] = await Promise.all([
    supabase.from("encontros").select("*").eq("turma_id", turma.id).order("data"),
    supabase.from("presencas").select("*").eq("matricula_id", matriculaId),
    supabase.from("justificativas").select("*").eq("matricula_id", matriculaId),
    supabase.from("materiais").select("*").eq("curso_id", curso.id).order("created_at", { ascending: false }),
  ]);

  const encontrosLista = (encontros ?? []) as Encontro[];
  const justificativasLista = (justificativas ?? []) as Justificativa[];

  const freq = calcularFrequencia(encontrosLista, (presencas ?? []) as Presenca[], justificativasLista);
  const aprovacao = calcularAprovacao(freq, matricula.nota, (curso as Curso).nota_minima);

  const hojeIso = new Date().toISOString().slice(0, 10);
  const presentesIds = new Set((presencas ?? []).filter((p) => p.presente).map((p) => p.encontro_id));
  const justificativaPorEncontro = new Map(justificativasLista.map((j) => [j.encontro_id, j]));
  const encontrosPorId = new Map(encontrosLista.map((e) => [e.id, e]));

  const faltasJustificaveis = encontrosLista
    .filter((e) => e.data <= hojeIso && !presentesIds.has(e.id))
    .filter((e) => {
      const j = justificativaPorEncontro.get(e.id);
      return !j || j.status === "rejeitada";
    })
    .sort((a, b) => (a.data < b.data ? -1 : 1));

  return (
    <main className="min-h-screen flex flex-col items-center">
      <LogoBand heightClassName="h-12" />
      <div className="w-full flex flex-col items-center px-4 py-8 gap-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-zosa-ink">{pessoa.nome}</h1>
          <p className="text-sm text-zosa-muted">
            {(curso as Curso).nome} · Turma das {(turma as Turma).horario}
          </p>
        </div>

        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-zosa-ink">{freq.percentual !== null ? `${freq.percentual}%` : "—"}</p>
              <p className="text-xs text-zosa-muted">Frequência</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zosa-ink">{freq.faltas}</p>
              <p className="text-xs text-zosa-muted">Faltas (máximas: {freq.faltasPermitidas})</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge
              label={STATUS_FREQUENCIA_LABELS[freq.status]}
              fg={STATUS_FREQUENCIA_COLORS[freq.status].fg}
              bg={STATUS_FREQUENCIA_COLORS[freq.status].bg}
            />
            <Badge
              label={STATUS_APROVACAO_LABELS[aprovacao]}
              fg={STATUS_APROVACAO_COLORS[aprovacao].fg}
              bg={STATUS_APROVACAO_COLORS[aprovacao].bg}
            />
          </div>
          {matricula.nota !== null && (
            <p className="text-center text-sm text-zosa-muted">
              Sua nota: <span className="font-semibold text-zosa-ink">{Number(matricula.nota).toFixed(1)}</span> (mínima
              para aprovar: {(curso as Curso).nota_minima.toFixed(1)})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zosa-ink">Materiais do curso</h2>
          <MateriaisList materiais={(materiais ?? []) as Material[]} />
        </div>

        <JustificarFaltaCard
          matriculaId={matriculaId}
          faltasJustificaveis={faltasJustificaveis}
          justificativas={justificativasLista}
          encontrosPorId={encontrosPorId}
        />

        <p className="text-center text-xs text-zosa-muted">
          Não é você? <Link href="/aluno" className="text-zosa-teal hover:underline">Buscar outro nome</Link>
        </p>
      </div>
      </div>
    </main>
  );
}
