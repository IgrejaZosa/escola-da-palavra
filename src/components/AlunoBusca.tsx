"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Resultado {
  matriculaId: string;
  pessoaNome: string;
  cursoNome: string;
  horario: string;
  rodadaNome: string;
}

export function AlunoBusca() {
  const [nome, setNome] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (nome.trim().length < 2) {
        setResultados([]);
        return;
      }
      setBuscando(true);
      try {
        const res = await fetch(`/api/aluno/buscar?nome=${encodeURIComponent(nome)}`);
        setResultados(await res.json());
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [nome]);

  return (
    <div className="w-full max-w-md space-y-3">
      <input
        autoFocus
        className="input"
        placeholder="Digite seu nome..."
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      {buscando && <p className="text-sm text-zosa-muted">Buscando...</p>}
      <div className="space-y-1.5">
        {resultados.map((r) => (
          <Link
            key={r.matriculaId}
            href={`/aluno/${r.matriculaId}`}
            className="card p-3 flex items-center justify-between hover:border-zosa-teal transition-colors block"
          >
            <div>
              <p className="text-sm font-medium text-zosa-ink">{r.pessoaNome}</p>
              <p className="text-xs text-zosa-muted">
                {r.cursoNome} · {r.horario} · {r.rodadaNome}
              </p>
            </div>
          </Link>
        ))}
        {!buscando && nome.trim().length >= 2 && resultados.length === 0 && (
          <p className="text-sm text-zosa-muted">Ninguém encontrado com esse nome.</p>
        )}
      </div>
    </div>
  );
}
