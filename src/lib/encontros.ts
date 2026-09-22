import type { Encontro } from "@/lib/types";

/** Encontro "do momento" pra fins de check-in: o mais recente que já
 * aconteceu (data <= hoje) — assim dá pra acessar o QR code fora do dia
 * exato da aula (ex: segunda-feira corrigindo um esquecimento) que a
 * presença ainda conta pro domingo certo, não pro dia real do acesso.
 * Se a rodada ainda não começou (nenhum encontro passado), cai pro
 * próximo encontro futuro, pra o link já funcionar antes do primeiro
 * domingo. */
export function encontroMaisRelevante(encontros: Encontro[], hoje: Date = new Date()): Encontro | null {
  if (encontros.length === 0) return null;
  const hojeIso = hoje.toISOString().slice(0, 10);

  const passados = encontros.filter((e) => e.data <= hojeIso).sort((a, b) => (a.data < b.data ? 1 : -1));
  if (passados.length > 0) return passados[0];

  const futuros = encontros.filter((e) => e.data > hojeIso).sort((a, b) => (a.data < b.data ? -1 : 1));
  return futuros[0] ?? null;
}

/** Todos os domingos entre data_inicio e data_fim (inclusive nas pontas),
 * como strings ISO (yyyy-MM-dd). Puro/sem I/O — usado tanto pra gerar os
 * encontros de verdade quanto pra pré-visualizar quantos domingos uma
 * rodada vai ter antes de salvar. */
export function domingosEntre(dataInicioIso: string, dataFimIso: string): string[] {
  const inicio = new Date(`${dataInicioIso}T00:00:00Z`);
  const fim = new Date(`${dataFimIso}T00:00:00Z`);

  const primeiroDomingo = new Date(inicio);
  const diaSemana = primeiroDomingo.getUTCDay(); // 0 = domingo
  if (diaSemana !== 0) {
    primeiroDomingo.setUTCDate(primeiroDomingo.getUTCDate() + (7 - diaSemana));
  }

  const domingos: string[] = [];
  const cursor = new Date(primeiroDomingo);
  while (cursor <= fim) {
    domingos.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return domingos;
}
