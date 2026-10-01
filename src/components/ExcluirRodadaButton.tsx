"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExcluirRodadaButton({ rodadaId, rodadaNome }: { rodadaId: string; rodadaNome: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (
      !confirm(
        `Excluir a rodada "${rodadaNome}"? Isso apaga permanentemente todos os cursos, turmas, matrículas, presenças, justificativas e materiais dela. Não dá pra desfazer.`
      )
    )
      return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/rodadas/${rodadaId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.erro ?? "Erro ao excluir rodada.");
        return;
      }
      router.push("/admin/rodadas");
      router.refresh();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <button onClick={excluir} disabled={excluindo} className="btn-secondary text-danger border-danger">
      {excluindo ? "Excluindo..." : "Excluir rodada"}
    </button>
  );
}
