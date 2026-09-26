import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";
import type { Curso } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CursoQrCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: curso } = await supabase.from("cursos").select("*").eq("id", id).single();
  if (!curso) notFound();

  return (
    <div className="py-8 space-y-2">
      <QrCodeDisplay cursoId={id} titulo={(curso as Curso).nome} />
      <p className="text-xs text-zosa-muted text-center">
        Um QR só pra este curso — quem escanear filtra o próprio horário (08h ou 16h30) na tela.
      </p>
    </div>
  );
}
