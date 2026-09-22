import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { gerarEncontros } from "@/lib/encontros-server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const { id } = await params;
  try {
    const resultado = await gerarEncontros(id);
    return NextResponse.json(resultado);
  } catch (e) {
    return erroJson(e instanceof Error ? e.message : "Erro ao gerar encontros.", 500);
  }
}
