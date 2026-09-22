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
