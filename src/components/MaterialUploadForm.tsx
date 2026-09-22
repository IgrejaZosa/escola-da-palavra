"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TipoMaterial } from "@/lib/types";

export function MaterialUploadForm({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoMaterial>("slide");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) {
      setErro("Escolha um arquivo.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("curso_id", cursoId);
      formData.append("titulo", titulo);
      formData.append("tipo", tipo);
      formData.append("arquivo", arquivo);

      const res = await fetch("/api/materiais", { method: "POST", body: formData });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao enviar material.");
        return;
      }
      setTitulo("");
      setArquivo(null);
      formRef.current?.reset();
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={enviar} className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zosa-ink">Postar material</h3>
      <div>
        <label className="label" htmlFor="titulo">
          Título
        </label>
        <input
          id="titulo"
          required
          className="input"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Slide - Semana 3"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="tipo">
            Tipo
          </label>
          <select id="tipo" className="input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaterial)}>
            <option value="slide">Slide</option>
            <option value="apostila">Apostila</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="arquivo">
            Arquivo
          </label>
          <input
            id="arquivo"
            type="file"
            required
            className="input"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <button type="submit" className="btn-primary" disabled={enviando}>
        {enviando ? "Enviando..." : "Postar material"}
      </button>
    </form>
  );
}
