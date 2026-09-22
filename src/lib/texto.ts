/** Normaliza texto pra comparação tolerante (usado ao casar nomes vindos de
 * planilhas do Forms com pessoas já cadastradas): minúsculas, sem acento,
 * espaços múltiplos colapsados, sem espaço nas pontas. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
