import { NextRequest, NextResponse } from "next/server";
import { exigirUsuario, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { erro } = await exigirUsuario("admin");
  if (erro) return erro;

  const body = await request.json().catch(() => ({}));
  const nome = (body.nome as string | undefined)?.trim();
  const dataInicio = body.data_inicio as string | undefined;
  const dataFim = body.data_fim as string | undefined;
  if (!nome || !dataInicio || !dataFim) return erroJson("Nome e período são obrigatórios.");
  if (dataFim <= dataInicio) return erroJson("Data final precisa ser depois da data inicial.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rodadas")
    .insert({ nome, data_inicio: dataInicio, data_fim: dataFim })
    .select("*")
    .single();
  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
