import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";
import { getUsuarioAtual } from "@/lib/auth";
import { professorTemAcessoATurma } from "@/lib/acesso-turma";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import type { TipoMaterial } from "@/lib/types";

const TIPOS_VALIDOS: TipoMaterial[] = ["slide", "apostila", "outro"];

/** Autoriza tanto professor (só pras turmas dele) quanto admin (qualquer
 * curso) - as duas telas usam esta mesma rota de upload. */
export async function POST(request: NextRequest) {
  const usuarioProfessor = await getUsuarioAtual("professor");
  const usuarioAdmin = await getUsuarioAtual("admin");
  const usuario = usuarioProfessor ?? usuarioAdmin;
  if (!usuario) return erroJson("Não autenticado.", 401);

  const formData = await request.formData();
  const cursoId = formData.get("curso_id");
  const titulo = formData.get("titulo");
  const tipo = formData.get("tipo");
  const arquivo = formData.get("arquivo");

  if (typeof cursoId !== "string" || typeof titulo !== "string" || typeof tipo !== "string") {
    return erroJson("Dados incompletos.");
  }
  if (!TIPOS_VALIDOS.includes(tipo as TipoMaterial)) return erroJson("Tipo inválido.");
  if (!(arquivo instanceof File)) return erroJson("Arquivo é obrigatório.");

  if (usuarioProfessor) {
    const supabaseLeitura = createClient();
    const { data: turmasDoCurso } = await supabaseLeitura.from("turmas").select("id").eq("curso_id", cursoId);
    const temAlgumaTurma = await Promise.all(
      (turmasDoCurso ?? []).map((t) => professorTemAcessoATurma(usuario.id, t.id as string))
    );
    if (!temAlgumaTurma.some(Boolean)) return erroJson("Você não leciona esse curso.", 403);
  }

  const supabase = createServiceClient();
  const extensao = arquivo.name.includes(".") ? arquivo.name.split(".").pop() : "";
  const caminho = `${cursoId}/${crypto.randomUUID()}${extensao ? `.${extensao}` : ""}`;

  const { error: erroUpload } = await supabase.storage
    .from("materiais")
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
  if (erroUpload) return erroJson(erroUpload.message, 500);

  const { data: publicUrlData } = supabase.storage.from("materiais").getPublicUrl(caminho);

  const { data, error } = await supabase
    .from("materiais")
    .insert({
      curso_id: cursoId,
      usuario_id: usuario.id,
      titulo,
      tipo,
      arquivo_url: publicUrlData.publicUrl,
    })
    .select("*")
    .single();
  if (error) return erroJson(error.message, 500);

  return NextResponse.json(data);
}
