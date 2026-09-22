import { NextResponse } from "next/server";
import { getUsuarioAtual } from "@/lib/auth";
import type { Papel, Usuario } from "@/lib/types";

/** Confere que quem está chamando a API é de fato um professor ou admin
 * "logado" (cookie de senha do papel + "quem é você" apontando pra um
 * usuário daquele papel) — checagem real de servidor, independente do
 * proxy (que só redireciona a navegação). */
export async function exigirUsuario(papel: Papel) {
  const usuario = await getUsuarioAtual(papel);
  if (!usuario) {
    return {
      usuario: null as Usuario | null,
      erro: NextResponse.json({ erro: "Não autenticado." }, { status: 401 }),
    };
  }
  return { usuario, erro: null };
}

export function erroJson(mensagem: string, status = 400) {
  return NextResponse.json({ erro: mensagem }, { status });
}
