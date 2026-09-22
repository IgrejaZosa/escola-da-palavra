import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Rodada } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: rodadas } = await supabase.from("rodadas").select("*").order("data_inicio", { ascending: false });
  const rodadaAtiva = (rodadas ?? []).find((r) => r.ativa) as Rodada | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zosa-ink">Painel administrativo</h1>

      {rodadaAtiva ? (
        <Link href={`/admin/rodadas/${rodadaAtiva.id}`} className="card p-5 block hover:border-zosa-teal transition-colors">
          <p className="text-xs font-medium text-zosa-teal">Rodada ativa</p>
          <p className="text-lg font-semibold text-zosa-ink mt-0.5">{rodadaAtiva.nome}</p>
          <p className="text-sm text-zosa-muted mt-1">
            {new Date(`${rodadaAtiva.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")} até{" "}
            {new Date(`${rodadaAtiva.data_fim}T00:00:00`).toLocaleDateString("pt-BR")}
          </p>
        </Link>
      ) : (
        <p className="card p-5 text-sm text-zosa-muted">Nenhuma rodada ativa no momento.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/admin/rodadas" className="card p-4 hover:border-zosa-teal transition-colors">
          <p className="font-medium text-zosa-ink">Rodadas</p>
          <p className="text-sm text-zosa-muted">Criar rodadas, cursos e turmas.</p>
        </Link>
        <Link href="/admin/usuarios" className="card p-4 hover:border-zosa-teal transition-colors">
          <p className="font-medium text-zosa-ink">Professores e admins</p>
          <p className="text-sm text-zosa-muted">Quem pode entrar nas áreas restritas.</p>
        </Link>
      </div>
    </div>
  );
}
