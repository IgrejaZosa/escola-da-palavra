import type { Encontro, Presenca } from "@/lib/types";

/** Máximo de faltas permitido antes de reprovar por frequência (acima disso
 * reprova, i.e. 4 faltas já reprova). */
export const MAX_FALTAS = 3;

export type StatusFrequencia = "ok" | "atencao" | "risco" | "reprovado";

export interface ResumoFrequencia {
  totalEncontros: number;
  encontrosRealizados: number; // encontros com data <= hoje
  presencas: number;
  faltas: number;
  percentual: number | null; // % de presença sobre os encontros já realizados
  status: StatusFrequencia;
}

/** Calcula frequência de uma matrícula a partir dos encontros da turma e das
 * presenças marcadas. Só conta falta em encontros que já aconteceram (não
 * pune por domingos futuros). */
export function calcularFrequencia(
  encontrosDaTurma: Encontro[],
  presencasDaMatricula: Presenca[],
  hoje: Date = new Date()
): ResumoFrequencia {
  const hojeIso = hoje.toISOString().slice(0, 10);
  const realizados = encontrosDaTurma.filter((e) => e.data <= hojeIso);
  const presentesIds = new Set(presencasDaMatricula.filter((p) => p.presente).map((p) => p.encontro_id));
  const presencas = realizados.filter((e) => presentesIds.has(e.id)).length;
  const faltas = realizados.length - presencas;

  let status: StatusFrequencia = "ok";
  if (faltas > MAX_FALTAS) status = "reprovado";
  else if (faltas === MAX_FALTAS) status = "risco";
  else if (faltas === MAX_FALTAS - 1) status = "atencao";

  return {
    totalEncontros: encontrosDaTurma.length,
    encontrosRealizados: realizados.length,
    presencas,
    faltas,
    percentual: realizados.length > 0 ? Math.round((presencas / realizados.length) * 1000) / 10 : null,
    status,
  };
}

export const STATUS_FREQUENCIA_LABELS: Record<StatusFrequencia, string> = {
  ok: "Em dia",
  atencao: "Atenção",
  risco: "Risco de reprovação",
  reprovado: "Acima do limite de faltas",
};

export const STATUS_FREQUENCIA_COLORS: Record<StatusFrequencia, { fg: string; bg: string }> = {
  ok: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  atencao: { fg: "var(--color-warn)", bg: "var(--color-warn-bg)" },
  risco: { fg: "var(--color-risco)", bg: "var(--color-risco-bg)" },
  reprovado: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

export type StatusAprovacao = "reprovado_falta" | "aguardando_nota" | "aprovado" | "reprovado_nota";

export const STATUS_APROVACAO_LABELS: Record<StatusAprovacao, string> = {
  reprovado_falta: "Reprovado por falta",
  aguardando_nota: "Aguardando nota",
  aprovado: "Aprovado",
  reprovado_nota: "Reprovado por nota",
};

export const STATUS_APROVACAO_COLORS: Record<StatusAprovacao, { fg: string; bg: string }> = {
  reprovado_falta: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
  aguardando_nota: { fg: "var(--color-zosa-muted)", bg: "var(--color-zosa-border)" },
  aprovado: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  reprovado_nota: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

/** Aprovação combina frequência (elimina de cara, independente da nota) com
 * a nota mínima do curso — só é avaliada depois que a nota é lançada. */
export function calcularAprovacao(faltas: number, nota: number | null, notaMinima: number): StatusAprovacao {
  if (faltas > MAX_FALTAS) return "reprovado_falta";
  if (nota === null) return "aguardando_nota";
  return nota >= notaMinima ? "aprovado" : "reprovado_nota";
}
