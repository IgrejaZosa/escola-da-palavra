import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/types";

const CORES = ["#287176", "#36afaf", "#1c5b54", "#71b9b7", "#c9922e", "#6d5dd3"];

export async function POST(request: NextRequest) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const body = await request.json().catch(() => ({}));
  const nome = (body.nome as string | undefined)?.trim();
  const papel = body.papel as Papel | undefined;
  if (!nome) return erroJson("Nome é obrigatório.");
  if (papel !== "professor" && papel !== "admin") return erroJson("Papel inválido.");

  const supabase = createServiceClient();
  const cor = CORES[Math.floor(Math.random() * CORES.length)];
  const { data, error } = await supabase.from("usuarios").insert({ nome, papel, cor }).select("*").single();
  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
