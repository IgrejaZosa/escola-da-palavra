"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { lerPlanilha, type PlanilhaLida } from "@/lib/planilha";
import { HORARIOS, type Curso, type Horario } from "@/lib/types";

const SEM_COLUNA = "";

export function ImportarInscricoesWizard({ rodadaId, cursos }: { rodadaId: string; cursos: Curso[] }) {
  const router = useRouter();
  const [planilha, setPlanilha] = useState<PlanilhaLida | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  const [colNome, setColNome] = useState(SEM_COLUNA);
  const [colTelefone, setColTelefone] = useState(SEM_COLUNA);
  const [colEmail, setColEmail] = useState(SEM_COLUNA);
  const [colCurso, setColCurso] = useState(SEM_COLUNA);
  const [colHorario, setColHorario] = useState(SEM_COLUNA);

  const [mapaCurso, setMapaCurso] = useState<Record<string, string>>({});
  const [mapaHorario, setMapaHorario] = useState<Record<string, Horario>>({});

  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ criadas: number; jaExistiam: number; semCurso: number; semHorario: number } | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErroLeitura(null);
    setResultado(null);
    try {
      const lida = await lerPlanilha(arquivo);
      setPlanilha(lida);
    } catch {
      setErroLeitura("Não consegui ler essa planilha. Confira se é um .xlsx, .xls ou .csv válido.");
    }
  }

  const idx = (col: string) => (planilha ? planilha.cabecalhos.indexOf(col) : -1);

  const valoresCurso = useMemo(() => {
    if (!planilha || colCurso === SEM_COLUNA) return [];
    const i = planilha.cabecalhos.indexOf(colCurso);
    return [...new Set(planilha.linhas.map((l) => (l[i] ?? "").trim()).filter(Boolean))];
  }, [planilha, colCurso]);

  const valoresHorario = useMemo(() => {
    if (!planilha || colHorario === SEM_COLUNA) return [];
    const i = planilha.cabecalhos.indexOf(colHorario);
    return [...new Set(planilha.linhas.map((l) => (l[i] ?? "").trim()).filter(Boolean))];
  }, [planilha, colHorario]);

  const prontoParaMapear = colNome !== SEM_COLUNA && colCurso !== SEM_COLUNA && colHorario !== SEM_COLUNA;
  const mapeamentoCompleto =
    valoresCurso.every((v) => mapaCurso[v]) && valoresHorario.every((v) => mapaHorario[v]) && valoresCurso.length > 0 && valoresHorario.length > 0;

  async function confirmar() {
    if (!planilha) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const iNome = idx(colNome);
      const iTelefone = colTelefone !== SEM_COLUNA ? idx(colTelefone) : -1;
      const iEmail = colEmail !== SEM_COLUNA ? idx(colEmail) : -1;
      const iCurso = idx(colCurso);
      const iHorario = idx(colHorario);

      const registros = planilha.linhas
        .map((l) => ({
          nome: (l[iNome] ?? "").trim(),
          telefone: iTelefone >= 0 ? (l[iTelefone] ?? "").trim() || null : null,
          email: iEmail >= 0 ? (l[iEmail] ?? "").trim() || null : null,
          curso_id: mapaCurso[(l[iCurso] ?? "").trim()] ?? null,
          horario: mapaHorario[(l[iHorario] ?? "").trim()] ?? null,
        }))
        .filter((r) => r.nome);

      const res = await fetch("/api/import/inscricoes/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rodada_id: rodadaId, registros }),
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
        <p className="text-sm text-zosa-ink">✅ {resultado.criadas} matrícula(s) criada(s)</p>
        {resultado.jaExistiam > 0 && <p className="text-sm text-zosa-muted">↪️ {resultado.jaExistiam} já existiam (ignoradas)</p>}
        {resultado.semCurso > 0 && <p className="text-sm text-danger">⚠️ {resultado.semCurso} linha(s) sem curso reconhecido</p>}
        {resultado.semHorario > 0 && <p className="text-sm text-danger">⚠️ {resultado.semHorario} linha(s) sem horário reconhecido</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-2">
        <label className="label" htmlFor="arquivo-inscricoes">
          Planilha de inscrições (exportada do Forms — .xlsx ou .csv)
        </label>
        <input id="arquivo-inscricoes" type="file" accept=".xlsx,.xls,.csv" className="input" onChange={aoEscolherArquivo} />
        {erroLeitura && <p className="text-sm text-danger">{erroLeitura}</p>}
      </div>

      {planilha && (
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-zosa-ink">
            Qual coluna é o quê? ({planilha.linhas.length} linha(s) encontrada(s))
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <ColunaSelect label="Nome (obrigatório)" colunas={planilha.cabecalhos} valor={colNome} onChange={setColNome} />
            <ColunaSelect label="Curso escolhido (obrigatório)" colunas={planilha.cabecalhos} valor={colCurso} onChange={setColCurso} />
            <ColunaSelect label="Horário escolhido (obrigatório)" colunas={planilha.cabecalhos} valor={colHorario} onChange={setColHorario} />
            <ColunaSelect label="Telefone (opcional)" colunas={planilha.cabecalhos} valor={colTelefone} onChange={setColTelefone} opcional />
            <ColunaSelect label="Email (opcional)" colunas={planilha.cabecalhos} valor={colEmail} onChange={setColEmail} opcional />
          </div>

          {prontoParaMapear && (
            <>
              {valoresCurso.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zosa-muted">Valores encontrados na coluna de curso → qual curso é:</p>
                  {valoresCurso.map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <span className="text-sm text-zosa-ink w-48 truncate" title={v}>
                        {v}
                      </span>
                      <select
                        className="input"
                        value={mapaCurso[v] ?? ""}
                        onChange={(e) => setMapaCurso((m) => ({ ...m, [v]: e.target.value }))}
                      >
                        <option value="">Selecione o curso...</option>
                        {cursos.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {valoresHorario.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zosa-muted">Valores encontrados na coluna de horário → qual horário é:</p>
                  {valoresHorario.map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <span className="text-sm text-zosa-ink w-48 truncate" title={v}>
                        {v}
                      </span>
                      <select
                        className="input"
                        value={mapaHorario[v] ?? ""}
                        onChange={(e) => setMapaHorario((m) => ({ ...m, [v]: e.target.value as Horario }))}
                      >
                        <option value="">Selecione o horário...</option>
                        {HORARIOS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {erroEnvio && <p className="text-sm text-danger">{erroEnvio}</p>}

          <button onClick={confirmar} disabled={!mapeamentoCompleto || enviando} className="btn-primary">
            {enviando ? "Importando..." : `Importar ${planilha.linhas.length} inscrição(ões)`}
          </button>
        </div>
      )}
    </div>
  );
}

function ColunaSelect({
  label,
  colunas,
  valor,
  onChange,
  opcional,
}: {
  label: string;
  colunas: string[];
  valor: string;
  onChange: (v: string) => void;
  opcional?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">{opcional ? "Nenhuma" : "Selecione a coluna..."}</option>
        {colunas.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
