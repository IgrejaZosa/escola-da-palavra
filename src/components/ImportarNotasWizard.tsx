"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { lerPlanilha, type PlanilhaLida } from "@/lib/planilha";

const SEM_COLUNA = "";

export function ImportarNotasWizard({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const [planilha, setPlanilha] = useState<PlanilhaLida | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [colNome, setColNome] = useState(SEM_COLUNA);
  const [colNota, setColNota] = useState(SEM_COLUNA);
  const [escalaDez, setEscalaDez] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ atualizadas: number; naoEncontradas: string[] } | null>(null);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErroLeitura(null);
    setResultado(null);
    try {
      setPlanilha(await lerPlanilha(arquivo));
    } catch {
      setErroLeitura("Não consegui ler essa planilha. Confira se é um .xlsx, .xls ou .csv válido.");
    }
  }

  const idx = (col: string) => (planilha ? planilha.cabecalhos.indexOf(col) : -1);
  const pronto = colNome !== SEM_COLUNA && colNota !== SEM_COLUNA;

  const previa = useMemo(() => {
    if (!planilha || !pronto) return [];
    const iNome = planilha.cabecalhos.indexOf(colNome);
    const iNota = planilha.cabecalhos.indexOf(colNota);
    return planilha.linhas.slice(0, 5).map((l) => ({ nome: l[iNome], nota: l[iNota] }));
  }, [planilha, colNome, colNota, pronto]);

  async function confirmar() {
    if (!planilha) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const iNome = idx(colNome);
      const iNota = idx(colNota);
      const registros = planilha.linhas
        .map((l) => {
          const notaTexto = (l[iNota] ?? "").replace(",", ".").trim();
          let nota = notaTexto === "" ? null : Number(notaTexto);
          if (nota !== null && !escalaDez) nota = Math.round((nota / 100) * 10 * 10) / 10; // % -> 0-10
          return { nome: (l[iNome] ?? "").trim(), nota };
        })
        .filter((r) => r.nome && r.nota !== null);

      const res = await fetch("/api/import/notas/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso_id: cursoId, registros }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroEnvio(json.erro ?? "Erro ao importar.");
        return;
      }
      setResultado(json);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <div className="card p-6 space-y-2">
        <h2 className="font-semibold text-zosa-ink">Importação concluída</h2>
        <p className="text-sm text-zosa-ink">✅ {resultado.atualizadas} nota(s) lançada(s)</p>
        {resultado.naoEncontradas.length > 0 && (
          <div>
            <p className="text-sm text-danger">⚠️ {resultado.naoEncontradas.length} nome(s) não encontrados na turma — lance manualmente:</p>
            <ul className="text-xs text-zosa-muted list-disc list-inside">
              {resultado.naoEncontradas.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-2">
        <label className="label" htmlFor="arquivo-notas">
          Planilha de notas (exportada do Forms da prova — .xlsx ou .csv)
        </label>
        <input id="arquivo-notas" type="file" accept=".xlsx,.xls,.csv" className="input" onChange={aoEscolherArquivo} />
        {erroLeitura && <p className="text-sm text-danger">{erroLeitura}</p>}
      </div>

      {planilha && (
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-zosa-ink">
            Qual coluna é o quê? ({planilha.linhas.length} linha(s) encontrada(s))
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome</label>
              <select className="input" value={colNome} onChange={(e) => setColNome(e.target.value)}>
                <option value="">Selecione a coluna...</option>
                {planilha.cabecalhos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nota</label>
              <select className="input" value={colNota} onChange={(e) => setColNota(e.target.value)}>
                <option value="">Selecione a coluna...</option>
                {planilha.cabecalhos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zosa-ink">
            <input type="checkbox" checked={escalaDez} onChange={(e) => setEscalaDez(e.target.checked)} />
            A coluna de nota já está na escala 0 a 10 (desmarque se estiver em % de acertos)
          </label>

          {previa.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zosa-muted mb-1">Prévia:</p>
              <ul className="text-xs text-zosa-ink space-y-0.5">
                {previa.map((p, i) => (
                  <li key={i}>
                    {p.nome} — {p.nota}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {erroEnvio && <p className="text-sm text-danger">{erroEnvio}</p>}

          <button onClick={confirmar} disabled={!pronto || enviando} className="btn-primary">
            {enviando ? "Importando..." : "Importar notas"}
          </button>
        </div>
      )}
    </div>
  );
}
