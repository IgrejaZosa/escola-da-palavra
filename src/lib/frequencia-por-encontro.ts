import type { MatriculaComDados } from "@/lib/dados-turma";
import type { Encontro } from "@/lib/types";

export interface ResumoEncontro {
  encontro: Encontro;
  jaAconteceu: boolean;
  presentes: MatriculaComDados[];
  faltas: MatriculaComDados[];
}

/** Pra cada encontro já ocorrido de uma turma, separa quem esteve presente
 * de quem faltou (matrícula ativa sem presença marcada = falta). Encontros
 * futuros vêm marcados como `jaAconteceu: false` — não faz sentido contar
 * falta de uma aula que ainda não rolou. Mais recente primeiro. */
export function resumoPorEncontro(
  encontros: Encontro[],
  matriculas: MatriculaComDados[],
  hoje: Date = new Date()
): ResumoEncontro[] {
  const hojeIso = hoje.toISOString().slice(0, 10);

  return [...encontros]
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .map((encontro) => {
      const jaAconteceu = encontro.data <= hojeIso;
      const presentes = matriculas.filter((m) =>
        m.presencas.some((p) => p.encontro_id === encontro.id && p.presente)
      );
      const presentesIds = new Set(presentes.map((m) => m.id));
      const faltas = jaAconteceu ? matriculas.filter((m) => !presentesIds.has(m.id)) : [];
      return { encontro, jaAconteceu, presentes, faltas };
    });
}
