import { createClient } from "@/lib/supabase/server";
import { EscolherUsuarioForm } from "@/components/EscolherUsuarioForm";
import type { Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuemEVoceAdminPage() {
  const supabase = createClient();
  const { data } = await supabase.from("usuarios").select("*").eq("papel", "admin").order("nome");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <EscolherUsuarioForm usuarios={(data ?? []) as Usuario[]} papel="admin" />
    </main>
  );
}
