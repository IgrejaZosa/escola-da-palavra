"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { resumoPorEncontro } from "@/lib/frequencia-por-encontro";
import type { DadosTurma, MatriculaComDados } from "@/lib/dados-turma";

export function TurmaFrequenciaEncontros({ dados }: { dados: DadosTurma }) {
  const router = useRouter();
  const resumos = resumoPorEncontro(dados.encontros, dados.matriculas);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);

  async function alterarPresenca(encontroId: string, matriculaId: string, presente: boolean) {
    setAlterandoId(matriculaId);
    try {
      await fetch(`/api/encontros/${encontroId}/presenca`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula_id: matriculaId, presente }),
      });
      router.refresh();
    } finally {
      setAlterandoId(null);
    }
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zosa-border text-left text-xs text-zosa-muted">
            <th className="px-4 py-2 font-medium">Encontro</th>
            <th className="px-4 py-2 font-medium">Presentes</th>
            <th className="px-4 py-2 font-medium">Faltas</th>
          </tr>
        </thead>
        <tbody>
          {resumos.map((r) => {
            const aberto = abertoId === r.encontro.id;
            return (
              <Fragment key={r.encontro.id}>
                <tr
                  onClick={() => r.jaAconteceu && setAbertoId(aberto ? null : r.encontro.id)}
                  className={`border-b border-zosa-border last:border-0 ${
                    r.jaAconteceu ? "cursor-pointer hover:bg-zosa-cream" : "opacity-50"
                  }`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    Semana {r.encontro.numero} · {new Date(`${r.encontro.data}T00:00:00`).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.jaAconteceu ? (
                      <span className="font-medium text-ok">{r.presentes.length}</span>
                    ) : (
                      <span className="text-zosa-muted">ainda não aconteceu</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.jaAconteceu && <span className="font-medium text-danger">{r.faltas.length}</span>}
                  </td>
                </tr>
                {aberto && (
                  <tr className="border-b border-zosa-border last:border-0 bg-zosa-cream/40">
                    <td colSpan={3} className="px-4 py-3">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <ListaPessoas
                          titulo={`✅ Presentes (${r.presentes.length})`}
                          pessoas={r.presentes}
                          alterandoId={alterandoId}
                          onAlterar={(matriculaId) => alterarPresenca(r.encontro.id, matriculaId, false)}
                          rotuloAcao="Marcar falta"
                        />
                        <ListaPessoas
                          titulo={`⛔ Faltas (${r.faltas.length})`}
                          pessoas={r.faltas}
                          alterandoId={alterandoId}
                          onAlterar={(matriculaId) => alterarPresenca(r.encontro.id, matriculaId, true)}
                          rotuloAcao="Marcar presença"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListaPessoas({
  titulo,
  pessoas,
  alterandoId,
  onAlterar,
  rotuloAcao,
}: {
  titulo: string;
  pessoas: MatriculaComDados[];
  alterandoId: string | null;
  onAlterar: (matriculaId: string) => void;
  rotuloAcao: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-zosa-muted mb-1">{titulo}</p>
      {pessoas.length === 0 ? (
        <p className="text-xs text-zosa-muted">Ninguém.</p>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {pessoas.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zosa-ink truncate">{m.pessoa.nome}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAlterar(m.id);
                }}
                disabled={alterandoId === m.id}
                className="text-xs text-zosa-teal hover:underline whitespace-nowrap disabled:opacity-50"
              >
                {alterandoId === m.id ? "..." : rotuloAcao}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
