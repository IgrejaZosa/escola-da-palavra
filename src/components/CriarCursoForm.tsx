"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CriarCursoForm({ rodadaId }: { rodadaId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [notaMinima, setNotaMinima] = useState("60");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rodada_id: rodadaId, nome, nota_minima: Number(notaMinima) }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao criar curso.");
        return;
      }
      setNome("");
      setAberto(false);
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn-secondary">
        + Novo curso
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="card p-4 space-y-3 max-w-md">
      <div>
        <label className="label" htmlFor="nome-curso">
          Nome do curso
        </label>
        <input id="nome-curso" required className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="nota-minima">
          Nota mínima de aprovação (0 a 100)
        </label>
        <input
          id="nota-minima"
          type="number"
          min={0}
          max={100}
          step={1}
          required
          className="input"
          value={notaMinima}
          onChange={(e) => setNotaMinima(e.target.value)}
        />
      </div>
      <p className="text-xs text-zosa-muted">
        As turmas das 08h e das 16h30 são criadas automaticamente junto com o curso.
      </p>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Criando..." : "Criar curso"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
