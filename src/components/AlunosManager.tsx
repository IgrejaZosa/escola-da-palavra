"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { normalizar } from "@/lib/texto";

export interface MatriculaLinha {
  id: string;
  status: "ativo" | "cancelado" | "transferido";
  turmaId: string;
  cursoNome: string;
  horario: string;
  rodadaNome: string;
}

export interface AlunoLinha {
  id: string;
  nome: string;
  telefone: string | null;
  matriculas: MatriculaLinha[];
}

export interface TurmaOpcao {
  id: string;
  label: string;
}

async function chamar(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json.erro ?? "Algo deu errado. Tente de novo.";
}

export function AlunosManager({ alunos, turmas }: { alunos: AlunoLinha[]; turmas: TurmaOpcao[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [addPara, setAddPara] = useState<string | null>(null);
  const [turmaSel, setTurmaSel] = useState("");

  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoTurma, setNovoTurma] = useState("");

  const filtrados = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return alunos;
    return alunos.filter((a) => normalizar(a.nome).includes(alvo));
  }, [alunos, busca]);

  async function executar(chave: string, acao: () => Promise<string | null>) {
    setErro(null);
    setOcupado(chave);
    try {
      const msg = await acao();
      if (msg) {
        setErro(msg);
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setOcupado(null);
    }
  }

  async function adicionar(aluno: AlunoLinha) {
    if (!turmaSel) return;
    const ok = await executar("add-" + aluno.id, () =>
      chamar(`/api/turmas/${turmaSel}/matriculas`, "POST", { pessoa_id: aluno.id })
    );
    if (ok) {
      setAddPara(null);
      setTurmaSel("");
    }
  }

  function retirar(aluno: AlunoLinha, m: MatriculaLinha) {
    if (!confirm(`Retirar ${aluno.nome} da turma ${m.cursoNome} · ${m.horario}? O histórico de presença e nota fica guardado.`)) return;
    executar(m.id, () => chamar(`/api/matriculas/${m.id}`, "PATCH", { status: "cancelado" }));
  }

  function reativar(m: MatriculaLinha) {
    executar(m.id, () => chamar(`/api/matriculas/${m.id}`, "PATCH", { status: "ativo" }));
  }

  function excluirMatricula(aluno: AlunoLinha, m: MatriculaLinha) {
    if (
      !confirm(
        `EXCLUIR ${aluno.nome} da turma ${m.cursoNome} · ${m.horario}? Isso apaga também as presenças, notas e justificativas dele nessa turma. Não dá pra desfazer.`
      )
    )
      return;
    executar(m.id, () => chamar(`/api/matriculas/${m.id}`, "DELETE"));
  }

  function excluirCadastro(aluno: AlunoLinha) {
    if (!confirm(`Excluir o cadastro de ${aluno.nome} do sistema? Todo o histórico dele(a) será apagado. Não dá pra desfazer.`)) return;
    executar("pessoa-" + aluno.id, () => chamar(`/api/pessoas/${aluno.id}`, "DELETE"));
  }

  async function cadastrarNovo(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim() || !novoTurma) return;
    const ok = await executar("novo", () =>
      chamar(`/api/turmas/${novoTurma}/matriculas`, "POST", { nome: novoNome, telefone: novoTelefone })
    );
    if (ok) {
      setNovoNome("");
      setNovoTelefone("");
      setNovoAberto(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input flex-1 min-w-[220px]"
          placeholder="Buscar aluno pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button onClick={() => setNovoAberto((v) => !v)} className="btn-secondary">
          {novoAberto ? "Cancelar" : "+ Cadastrar novo aluno"}
        </button>
      </div>

      {novoAberto && (
        <form onSubmit={cadastrarNovo} className="card p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="label" htmlFor="novo-nome">
              Nome
            </label>
            <input id="novo-nome" className="input" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} autoFocus />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label" htmlFor="novo-tel">
              Telefone (opcional)
            </label>
            <input id="novo-tel" className="input" value={novoTelefone} onChange={(e) => setNovoTelefone(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="label" htmlFor="novo-turma">
              Turma
            </label>
            <select id="novo-turma" className="input" value={novoTurma} onChange={(e) => setNovoTurma(e.target.value)}>
              <option value="">Escolha a turma...</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={ocupado === "novo" || !novoNome.trim() || !novoTurma}>
            {ocupado === "novo" ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <p className="text-xs text-zosa-muted">
        {filtrados.length} de {alunos.length} aluno(s)
      </p>

      <div className="space-y-2">
        {filtrados.map((a) => {
          const ativas = a.matriculas.filter((m) => m.status === "ativo");
          const ordenadas = [...a.matriculas].sort((x, y) => (x.status === "ativo" ? 0 : 1) - (y.status === "ativo" ? 0 : 1));
          const turmasOcupadas = new Set(ativas.map((m) => m.turmaId));
          const disponiveis = turmas.filter((t) => !turmasOcupadas.has(t.id));
          return (
            <div key={a.id} className="card p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-zosa-ink">{a.nome}</p>
                  <WhatsAppLink telefone={a.telefone} nome={a.nome} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {ativas.length === 0 && (
                    <button
                      onClick={() => excluirCadastro(a)}
                      disabled={ocupado === "pessoa-" + a.id}
                      className="text-xs text-danger hover:underline disabled:opacity-50"
                    >
                      Excluir cadastro
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAddPara(addPara === a.id ? null : a.id);
                      setTurmaSel("");
                    }}
                    className="btn-secondary"
                  >
                    {addPara === a.id ? "Cancelar" : "+ Adicionar a uma turma"}
                  </button>
                </div>
              </div>

              {addPara === a.id && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-zosa-cream p-3">
                  <select className="input flex-1 min-w-[220px]" value={turmaSel} onChange={(e) => setTurmaSel(e.target.value)}>
                    <option value="">Escolha a turma...</option>
                    {disponiveis.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => adicionar(a)} disabled={!turmaSel || ocupado === "add-" + a.id} className="btn-primary">
                    {ocupado === "add-" + a.id ? "Adicionando..." : "Adicionar"}
                  </button>
                </div>
              )}

              {ordenadas.length === 0 ? (
                <p className="text-xs text-zosa-muted">Sem turma.</p>
              ) : (
                <ul className="divide-y divide-zosa-border">
                  {ordenadas.map((m) => (
                    <li key={m.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm ${m.status === "ativo" ? "text-zosa-ink" : "text-zosa-muted"}`}>
                          {m.cursoNome} · {m.horario}
                        </span>
                        <span className="text-xs text-zosa-muted">{m.rodadaNome}</span>
                        {m.status !== "ativo" && (
                          <Badge label="Retirado" fg="var(--color-zosa-muted)" bg="var(--color-zosa-border)" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {m.status === "ativo" ? (
                          <button
                            onClick={() => retirar(a, m)}
                            disabled={ocupado === m.id}
                            className="text-xs text-zosa-teal hover:underline disabled:opacity-50"
                          >
                            Retirar da turma
                          </button>
                        ) : (
                          <button
                            onClick={() => reativar(m)}
                            disabled={ocupado === m.id}
                            className="text-xs text-zosa-teal hover:underline disabled:opacity-50"
                          >
                            Reativar
                          </button>
                        )}
                        <button
                          onClick={() => excluirMatricula(a, m)}
                          disabled={ocupado === m.id}
                          className="text-xs text-danger hover:underline disabled:opacity-50"
                        >
                          Excluir da turma
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {filtrados.length === 0 && <p className="card p-4 text-sm text-zosa-muted">Nenhum aluno encontrado.</p>}
      </div>
    </div>
  );
}
