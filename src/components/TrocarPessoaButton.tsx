"use client";

import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/types";

export function TrocarPessoaButton({ papel }: { papel: Papel }) {
  const router = useRouter();

  function trocar() {
    document.cookie = "escola_usuario_id=; Max-Age=0; path=/";
    router.push(papel === "professor" ? "/professor/quem-e-voce" : "/admin/quem-e-voce");
    router.refresh();
  }

  return (
    <button onClick={trocar} className="btn-secondary">
      Trocar pessoa
    </button>
  );
}
