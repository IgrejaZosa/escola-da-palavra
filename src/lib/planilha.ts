import * as XLSX from "xlsx";

export interface PlanilhaLida {
  cabecalhos: string[];
  linhas: string[][]; // sem a linha de cabeçalho
}

/** Lê um .xlsx/.xls/.csv no navegador (sem round-trip pro servidor) e
 * devolve cabeçalhos + linhas cruas como texto, prontas pra UI de
 * mapeamento de colunas decidir o que é o quê. */
export async function lerPlanilha(arquivo: File): Promise<PlanilhaLida> {
  const buffer = await arquivo.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const primeiraAba = workbook.SheetNames[0];
  const sheet = workbook.Sheets[primeiraAba];
  const linhasCruas = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });

  const [cabecalhos = [], ...linhas] = linhasCruas;
  const linhasNaoVazias = linhas.filter((l) => l.some((v) => String(v ?? "").trim() !== ""));
  return { cabecalhos: cabecalhos.map((c) => String(c ?? "").trim()), linhas: linhasNaoVazias };
}
