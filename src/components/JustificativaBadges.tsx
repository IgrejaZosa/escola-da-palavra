import { Badge } from "@/components/Badge";
import {
  MOTIVO_JUSTIFICATIVA_LABELS,
  STATUS_JUSTIFICATIVA_COLORS,
  STATUS_JUSTIFICATIVA_LABELS,
  type Encontro,
  type Justificativa,
} from "@/lib/types";

/** Lista compacta das justificativas de uma matrícula, uma badge por
 * encontro justificado — usada nas tabelas de indicadores pra secretaria/
 * professor verem de cara quem já tem falta em validação sem precisar abrir
 * cada aluno. */
export function JustificativaBadges({
  justificativas,
  encontros,
}: {
  justificativas: Justificativa[];
  encontros: Encontro[];
}) {
  if (justificativas.length === 0) return <span className="text-zosa-muted">—</span>;

  const dataPorEncontro = new Map(encontros.map((e) => [e.id, e.data]));

  return (
    <div className="flex flex-col gap-1">
      {justificativas.map((j) => {
        const data = dataPorEncontro.get(j.encontro_id);
        return (
          <div key={j.id} className="flex items-center gap-1.5">
            {data && (
              <span className="text-xs text-zosa-muted whitespace-nowrap">
                {new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR")}
              </span>
            )}
            <Badge
              label={`${MOTIVO_JUSTIFICATIVA_LABELS[j.motivo]} · ${STATUS_JUSTIFICATIVA_LABELS[j.status]}`}
              fg={STATUS_JUSTIFICATIVA_COLORS[j.status].fg}
              bg={STATUS_JUSTIFICATIVA_COLORS[j.status].bg}
            />
          </div>
        );
      })}
    </div>
  );
}
