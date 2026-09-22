import {
  calcularAprovacao,
  calcularFrequencia,
  STATUS_APROVACAO_COLORS,
  STATUS_APROVACAO_LABELS,
  STATUS_FREQUENCIA_COLORS,
  STATUS_FREQUENCIA_LABELS,
} from "@/lib/frequencia";
import { Badge } from "@/components/Badge";
import type { DadosTurma } from "@/lib/dados-turma";

/** Tabela de frequência/nota/aprovação por pessoa de uma turma — usada tanto
 * na tela do professor quanto na do admin (mesmos dados, mesma leitura). */
export function TurmaIndicadoresTable({ dados }: { dados: DadosTurma }) {
  const { curso, encontros, matriculas } = dados;

  if (matriculas.length === 0) {
    return <p className="card p-6 text-sm text-zosa-muted">Nenhuma pessoa matriculada nesta turma ainda.</p>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zosa-border text-left text-xs text-zosa-muted">
            <th className="px-4 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Frequência</th>
            <th className="px-4 py-2 font-medium">Faltas</th>
            <th className="px-4 py-2 font-medium">Nota</th>
            <th className="px-4 py-2 font-medium">Situação de frequência</th>
            <th className="px-4 py-2 font-medium">Aprovação</th>
          </tr>
        </thead>
        <tbody>
          {matriculas.map((m) => {
            const freq = calcularFrequencia(encontros, m.presencas);
            const aprovacao = calcularAprovacao(freq.faltas, m.nota, curso.nota_minima);
            return (
              <tr key={m.id} className="border-b border-zosa-border last:border-0">
                <td className="px-4 py-2.5 font-medium text-zosa-ink whitespace-nowrap">{m.pessoa.nome}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {freq.percentual !== null ? `${freq.percentual}%` : "—"}
                  <span className="text-zosa-muted"> ({freq.presencas}/{freq.encontrosRealizados})</span>
                </td>
                <td className="px-4 py-2.5">{freq.faltas}</td>
                <td className="px-4 py-2.5">{m.nota !== null ? m.nota.toFixed(1) : "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge
                    label={STATUS_FREQUENCIA_LABELS[freq.status]}
                    fg={STATUS_FREQUENCIA_COLORS[freq.status].fg}
                    bg={STATUS_FREQUENCIA_COLORS[freq.status].bg}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    label={STATUS_APROVACAO_LABELS[aprovacao]}
                    fg={STATUS_APROVACAO_COLORS[aprovacao].fg}
                    bg={STATUS_APROVACAO_COLORS[aprovacao].bg}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
