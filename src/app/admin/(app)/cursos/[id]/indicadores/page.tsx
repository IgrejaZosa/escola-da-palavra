import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarDadosTurma } from "@/lib/dados-turma";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import {
  calcularAprovacao,
  calcularFrequencia,
  STATUS_APROVACAO_COLORS,
  STATUS_APROVACAO_LABELS,
  STATUS_FREQUENCIA_COLORS,
  STATUS_FREQUENCIA_LABELS,
} from "@/lib/frequencia";
import { TurmaFrequenciaEncontros } from "@/components/TurmaFrequenciaEncontros";
import { HORARIOS, type Curso, type Turma } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CursoIndicadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const { data: curso } = await supabase.from("cursos").select("*").eq("id", id).single();
  if (!curso) notFound();

  const { data: turmas } = await supabase.from("turmas").select("*").eq("curso_id", id);
  const dadosPorTurma = await Promise.all(((turmas ?? []) as Turma[]).map((t) => buscarDadosTurma(t.id)));

  const linhas = dadosPorTurma
    .filter((d): d is NonNullable<typeof d> => !!d)
    .flatMap((dados) =>
      dados.matriculas.map((m) => {
        const freq = calcularFrequencia(dados.encontros, m.presencas);
        const aprovacao = calcularAprovacao(freq.faltas, m.nota, (curso as Curso).nota_minima);
        return { matricula: m, turma: dados.turma, freq, aprovacao };
      })
    );

  const total = linhas.length;
  const comFrequenciaCalculada = linhas.filter((l) => l.freq.percentual !== null);
  const frequenciaMedia =
    comFrequenciaCalculada.length > 0
      ? Math.round(
          (comFrequenciaCalculada.reduce((soma, l) => soma + (l.freq.percentual ?? 0), 0) /
            comFrequenciaCalculada.length) *
            10
        ) / 10
      : null;
  const aprovados = linhas.filter((l) => l.aprovacao === "aprovado").length;
  const reprovados = linhas.filter((l) => l.aprovacao === "reprovado_falta" || l.aprovacao === "reprovado_nota").length;
  const emRisco = linhas.filter((l) => l.freq.status === "atencao" || l.freq.status === "risco");

  const emRiscoOrdenados = [...emRisco].sort((a, b) => b.freq.faltas - a.freq.faltas);

  const porTurma = HORARIOS.map((horario) => {
    const doHorario = linhas.filter((l) => l.turma.horario === horario);
    const comFreq = doHorario.filter((l) => l.freq.percentual !== null);
    const freqMedia =
      comFreq.length > 0
        ? Math.round((comFreq.reduce((s, l) => s + (l.freq.percentual ?? 0), 0) / comFreq.length) * 10) / 10
        : null;
    return { horario, total: doHorario.length, freqMedia };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Indicadores — {(curso as Curso).nome}</h1>
        <p className="text-sm text-zosa-muted">Turmas das 08h e 16h30 combinadas.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Inscritos ativos" value={total} emoji="👥" />
        <StatCard label="Frequência média" value={frequenciaMedia !== null ? `${frequenciaMedia}%` : "—"} emoji="📊" />
        <StatCard label="Aprovados até agora" value={aprovados} emoji="✅" />
        <StatCard label="Reprovados" value={reprovados} emoji="⛔" />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zosa-ink">Inscritos por turma</h2>
        <div className="grid grid-cols-2 gap-3">
          {porTurma.map((t) => (
            <div key={t.horario} className="card p-4">
              <p className="text-xs font-medium text-zosa-muted">{t.horario === "08h" ? "🌅 Manhã (08h)" : "🌇 Tarde (16h30)"}</p>
              <p className="text-2xl font-bold text-zosa-ink mt-1">{t.total}</p>
              <p className="text-xs text-zosa-muted mt-0.5">
                frequência média {t.freqMedia !== null ? `${t.freqMedia}%` : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zosa-ink">Frequência por encontro</h2>
          <p className="text-xs text-zosa-muted">
            Clique num encontro pra ver quem esteve presente e quem faltou naquele dia — dá pra corrigir na hora se
            alguém esqueceu de marcar.
          </p>
        </div>
        {dadosPorTurma
          .filter((d): d is NonNullable<typeof d> => !!d)
          .map((dados) => (
            <div key={dados.turma.id} className="space-y-1.5">
              <p className="text-xs font-medium text-zosa-muted">Turma das {dados.turma.horario}</p>
              <TurmaFrequenciaEncontros dados={dados} />
            </div>
          ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zosa-ink">
          Quem está em risco de reprovar por falta ({emRiscoOrdenados.length})
        </h2>
        <p className="text-xs text-zosa-muted">
          2 faltas = atenção, 3 faltas = risco (uma falta a mais já reprova). Bom ponto de partida pra secretaria
          mandar mensagem essa semana.
        </p>
        {emRiscoOrdenados.length === 0 ? (
          <p className="card p-4 text-sm text-zosa-muted">Ninguém em risco no momento.</p>
        ) : (
          <div className="card divide-y divide-zosa-border">
            {emRiscoOrdenados.map((l) => (
              <div key={l.matricula.id} className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-zosa-ink">{l.matricula.pessoa.nome}</p>
                  <p className="text-xs text-zosa-muted">
                    Turma das {l.turma.horario} · {l.freq.faltas} falta(s)
                    {l.matricula.pessoa.telefone ? ` · ${l.matricula.pessoa.telefone}` : ""}
                  </p>
                </div>
                <Badge
                  label={STATUS_FREQUENCIA_LABELS[l.freq.status]}
                  fg={STATUS_FREQUENCIA_COLORS[l.freq.status].fg}
                  bg={STATUS_FREQUENCIA_COLORS[l.freq.status].bg}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zosa-ink">Todo mundo</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zosa-border text-left text-xs text-zosa-muted">
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Turma</th>
                <th className="px-4 py-2 font-medium">Faltas</th>
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="px-4 py-2 font-medium">Aprovação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.matricula.id} className="border-b border-zosa-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-zosa-ink whitespace-nowrap">{l.matricula.pessoa.nome}</td>
                  <td className="px-4 py-2.5">{l.turma.horario}</td>
                  <td className="px-4 py-2.5">{l.freq.faltas}</td>
                  <td className="px-4 py-2.5">{l.matricula.nota !== null ? l.matricula.nota.toFixed(1) : "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      label={STATUS_APROVACAO_LABELS[l.aprovacao]}
                      fg={STATUS_APROVACAO_COLORS[l.aprovacao].fg}
                      bg={STATUS_APROVACAO_COLORS[l.aprovacao].bg}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
