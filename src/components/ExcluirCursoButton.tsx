"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExcluirCursoButton({ cursoId, cursoNome }: { cursoId: string; cursoNome: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Excluir o curso "${cursoNome}"? Isso apaga permanentemente as turmas, matrículas, presenças, justificativas e materiais desse curso. Não dá pra desfazer.`
      )
    )
      return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.erro ?? "Erro ao excluir curso.");
        return;
      }
      router.refresh();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <button
      onClick={excluir}
      disabled={excluindo}
      className="text-xs text-danger hover:underline disabled:opacity-50 whitespace-nowrap"
    >
      {excluindo ? "Excluindo..." : "Excluir curso"}
    </button>
  );
}
