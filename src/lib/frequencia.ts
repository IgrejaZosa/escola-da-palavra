import type { Encontro, Justificativa, Presenca } from "@/lib/types";

/** Mínimo de presenças pra aprovar por frequência, independente de quantos
 * encontros a rodada tiver no total (rodadas variam de ~8 a ~10 semanas). */
export const MIN_PRESENCAS = 7;

export type StatusFrequencia = "ok" | "atencao" | "risco" | "revisar" | "reprovado";

export interface ResumoFrequencia {
  totalEncontros: number;
  encontrosRealizados: number; // encontros com data <= hoje
  presencas: number;
  faltas: number; // faltas totais (sem presença), incluindo as com justificativa aprovada
  faltasJustificadas: number; // subconjunto de `faltas` com justificativa aprovada pelo admin
  faltasPermitidas: number; // totalEncontros - MIN_PRESENCAS (nunca negativo)
  percentual: number | null; // % de presença sobre os encontros já realizados
  status: StatusFrequencia;
}

/** Calcula frequência de uma matrícula a partir dos encontros da turma, das
 * presenças marcadas e das justificativas de falta já aprovadas. Só conta
 * falta em encontros que já aconteceram (não pune por domingos futuros).
 * Uma falta justificada e aprovada nunca conta como presença, mas também
 * nunca reprova sozinha — se ela empurrar o total de faltas além do
 * permitido, o status vira "revisar" em vez de "reprovado" (fica pra
 * decisão manual do admin). */
export function calcularFrequencia(
  encontrosDaTurma: Encontro[],
  presencasDaMatricula: Presenca[],
  justificativasDaMatricula: Justificativa[] = [],
  hoje: Date = new Date()
): ResumoFrequencia {
  const hojeIso = hoje.toISOString().slice(0, 10);
  const realizados = encontrosDaTurma.filter((e) => e.data <= hojeIso);
  const presentesIds = new Set(presencasDaMatricula.filter((p) => p.presente).map((p) => p.encontro_id));
  const justificadasIds = new Set(
    justificativasDaMatricula.filter((j) => j.status === "aprovada").map((j) => j.encontro_id)
  );

  const presencas = realizados.filter((e) => presentesIds.has(e.id)).length;
  const encontrosDeFalta = realizados.filter((e) => !presentesIds.has(e.id));
  const faltas = encontrosDeFalta.length;
  const faltasJustificadas = encontrosDeFalta.filter((e) => justificadasIds.has(e.id)).length;
  const faltasNaoJustificadas = faltas - faltasJustificadas;

  const faltasPermitidas = Math.max(0, encontrosDaTurma.length - MIN_PRESENCAS);

  let status: StatusFrequencia;
  if (faltasNaoJustificadas > faltasPermitidas) status = "reprovado";
  else if (faltas > faltasPermitidas) status = "revisar";
  else if (faltasNaoJustificadas === faltasPermitidas) status = "risco";
  else if (faltasNaoJustificadas === faltasPermitidas - 1) status = "atencao";
  else status = "ok";

  return {
    totalEncontros: encontrosDaTurma.length,
    encontrosRealizados: realizados.length,
    presencas,
    faltas,
    faltasJustificadas,
    faltasPermitidas,
    percentual: realizados.length > 0 ? Math.round((presencas / realizados.length) * 1000) / 10 : null,
    status,
  };
}

export const STATUS_FREQUENCIA_LABELS: Record<StatusFrequencia, string> = {
  ok: "Em dia",
  atencao: "Atenção",
  risco: "Risco de reprovação",
  revisar: "Revisar frequência",
  reprovado: "Acima do limite de faltas",
};

export const STATUS_FREQUENCIA_COLORS: Record<StatusFrequencia, { fg: string; bg: string }> = {
  ok: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  atencao: { fg: "var(--color-warn)", bg: "var(--color-warn-bg)" },
  risco: { fg: "var(--color-risco)", bg: "var(--color-risco-bg)" },
  revisar: { fg: "var(--color-ep-teal)", bg: "var(--color-ep-tealbg)" },
  reprovado: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

export type StatusAprovacao =
  | "reprovado_falta"
  | "revisar_frequencia"
  | "aguardando_nota"
  | "aprovado"
  | "reprovado_nota";

export const STATUS_APROVACAO_LABELS: Record<StatusAprovacao, string> = {
  reprovado_falta: "Reprovado por falta",
  revisar_frequencia: "Revisar frequência (admin)",
  aguardando_nota: "Aguardando nota",
  aprovado: "Aprovado",
  reprovado_nota: "Reprovado por nota",
};

export const STATUS_APROVACAO_COLORS: Record<StatusAprovacao, { fg: string; bg: string }> = {
  reprovado_falta: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
  revisar_frequencia: { fg: "var(--color-ep-teal)", bg: "var(--color-ep-tealbg)" },
  aguardando_nota: { fg: "var(--color-zosa-muted)", bg: "var(--color-zosa-border)" },
  aprovado: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  reprovado_nota: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

/** Aprovação combina frequência (elimina de cara, independente da nota) com
 * a nota mínima do curso — só é avaliada depois que a nota é lançada. */
export function calcularAprovacao(freq: ResumoFrequencia, nota: number | null, notaMinima: number): StatusAprovacao {
  if (freq.status === "reprovado") return "reprovado_falta";
  if (freq.status === "revisar") return "revisar_frequencia";
  if (nota === null) return "aguardando_nota";
  return nota >= notaMinima ? "aprovado" : "reprovado_nota";
}
