import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Papel, Usuario } from "@/lib/types";

export const COOKIE_ACESSO_PROFESSOR = "escola_acesso_professor";
export const COOKIE_ACESSO_ADMIN = "escola_acesso_admin";
export const COOKIE_USUARIO = "escola_usuario_id";

/** Retorna quem escolheu "Quem é você?" (cookie escola_usuario_id),
 * validando que o papel bate com o exigido (professor pode ter cookie mas
 * não pode agir como admin e vice-versa). Não é login de verdade — é só a
 * identidade usada para atribuição (quem marcou nota, quem postou material). */
export async function getUsuarioAtual(papelExigido: Papel): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const usuarioId = cookieStore.get(COOKIE_USUARIO)?.value;
  if (!usuarioId) return null;

  const supabase = createClient();
  const { data } = await supabase.from("usuarios").select("*").eq("id", usuarioId).single();
  const usuario = (data as Usuario) ?? null;
  if (!usuario || usuario.papel !== papelExigido) return null;
  return usuario;
}
