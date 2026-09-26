"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  calcularAprovacao,
  calcularFrequencia,
  STATUS_APROVACAO_COLORS,
  STATUS_APROVACAO_LABELS,
  STATUS_FREQUENCIA_COLORS,
  STATUS_FREQUENCIA_LABELS,
} from "@/lib/frequencia";
import { Badge } from "@/components/Badge";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { JustificativaBadges } from "@/components/JustificativaBadges";
import type { DadosTurma } from "@/lib/dados-turma";

/** Igual ao TurmaIndicadoresTable, mas com adicionar/remover aluno embutido
 * na própria tela — usado só na área do admin (professor continua com a
 * tabela somente-leitura). */
export function TurmaGerenciavel({ turmaId, dados }: { turmaId: string; dados: DadosTurma }) {
  const router = useRouter();
  const { curso, encontros, matriculas } = dados;

  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch(`/api/turmas/${turmaId}/matriculas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao matricular.");
        return;
      }
      setNome("");
      setTelefone("");
      setFormAberto(false);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  async function remover(matriculaId: string, nomePessoa: string) {
    if (!confirm(`Retirar ${nomePessoa} desta turma? O histórico de presença/nota fica guardado.`)) return;
    setRemovendoId(matriculaId);
    try {
      await fetch(`/api/matriculas/${matriculaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" }),
      });
      router.refresh();
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="space-y-3">
      {formAberto ? (
        <form onSubmit={adicionar} className="card p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="label" htmlFor={`nome-${turmaId}`}>
              Nome
            </label>
            <input id={`nome-${turmaId}`} className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label" htmlFor={`telefone-${turmaId}`}>
              Telefone (opcional)
            </label>
            <input
              id={`telefone-${turmaId}`}
              className="input"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? "Adicionando..." : "Adicionar"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setFormAberto(false)}>
            Cancelar
          </button>
          {erro && <p className="text-sm text-danger w-full">{erro}</p>}
        </form>
      ) : (
        <button onClick={() => setFormAberto(true)} className="btn-secondary">
          + Adicionar aluno
        </button>
      )}

      {matriculas.length === 0 ? (
        <p className="card p-6 text-sm text-zosa-muted">Nenhuma pessoa matriculada nesta turma ainda.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zosa-border text-left text-xs text-zosa-muted">
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Frequência</th>
                <th className="px-4 py-2 font-medium">Faltas</th>
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="px-4 py-2 font-medium">Situação de frequência</th>
                <th className="px-4 py-2 font-medium">Aprovação</th>
                <th className="px-4 py-2 font-medium">Justificativas</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map((m) => {
                const freq = calcularFrequencia(encontros, m.presencas, m.justificativas);
                const aprovacao = calcularAprovacao(freq, m.nota, curso.nota_minima);
                return (
                  <tr key={m.id} className="border-b border-zosa-border last:border-0">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <p className="font-medium text-zosa-ink">{m.pessoa.nome}</p>
                      <WhatsAppLink telefone={m.pessoa.telefone} nome={m.pessoa.nome} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {freq.percentual !== null ? `${freq.percentual}%` : "—"}
                      <span className="text-zosa-muted"> ({freq.presencas}/{freq.encontrosRealizados})</span>
                    </td>
                    <td className="px-4 py-2.5">{freq.faltas}</td>
                    <td className="px-4 py-2.5">{m.nota !== null ? m.nota.toFixed(1) : "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        label={STATUS_FREQUENCIA_LABELS[freq.status]}
                        fg={STATUS_FREQUENCIA_COLORS[freq.status].fg}
                        bg={STATUS_FREQUENCIA_COLORS[freq.status].bg}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        label={STATUS_APROVACAO_LABELS[aprovacao]}
                        fg={STATUS_APROVACAO_COLORS[aprovacao].fg}
                        bg={STATUS_APROVACAO_COLORS[aprovacao].bg}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <JustificativaBadges justificativas={m.justificativas} encontros={encontros} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => remover(m.id, m.pessoa.nome)}
                        disabled={removendoId === m.id}
                        className="text-xs text-danger hover:underline disabled:opacity-50 whitespace-nowrap"
                      >
                        {removendoId === m.id ? "Removendo..." : "Remover"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
