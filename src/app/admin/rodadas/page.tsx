import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CriarRodadaForm } from "@/components/CriarRodadaForm";
import { Badge } from "@/components/Badge";
import type { Rodada } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRodadasPage() {
  const supabase = createClient();
  const { data } = await supabase.from("rodadas").select("*").order("data_inicio", { ascending: false });
  const rodadas = (data ?? []) as Rodada[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zosa-ink">Rodadas</h1>
      </div>
      <CriarRodadaForm />
      <div className="space-y-2">
        {rodadas.map((r) => (
          <Link
            key={r.id}
            href={`/admin/rodadas/${r.id}`}
            className="card p-4 flex items-center justify-between hover:border-zosa-teal transition-colors"
          >
            <div>
              <p className="font-medium text-zosa-ink">{r.nome}</p>
              <p className="text-xs text-zosa-muted">
                {new Date(`${r.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")} até{" "}
                {new Date(`${r.data_fim}T00:00:00`).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {r.ativa && <Badge label="Ativa" fg="var(--color-ok)" bg="var(--color-ok-bg)" />}
          </Link>
        ))}
        {rodadas.length === 0 && <p className="text-sm text-zosa-muted">Nenhuma rodada cadastrada ainda.</p>}
      </div>
    </div>
  );
}
