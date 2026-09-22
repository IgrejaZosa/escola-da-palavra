import { createClient } from "@/lib/supabase/server";
import { UsuariosManager } from "@/components/UsuariosManager";
import type { Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const supabase = createClient();
  const { data } = await supabase.from("usuarios").select("*").order("nome");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ep-dark">Professores e administradores</h1>
      <UsuariosManager usuarios={(data ?? []) as Usuario[]} />
    </div>
  );
}
