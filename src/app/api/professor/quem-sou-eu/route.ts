import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";

const UM_ANO = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const usuarioId = body.usuario_id as string | undefined;
  if (!usuarioId) return erroJson("usuario_id é obrigatório.");

  const supabase = createClient();
  const { data } = await supabase.from("usuarios").select("*").eq("id", usuarioId).eq("papel", "professor").single();
  if (!data) return erroJson("Professor não encontrado.", 404);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("escola_usuario_id", usuarioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UM_ANO,
  });
  return res;
}
