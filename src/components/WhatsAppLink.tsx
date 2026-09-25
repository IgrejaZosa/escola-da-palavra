import { MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/whatsapp";

/** Botão/link pro WhatsApp da pessoa — aparece ao lado do nome em qualquer
 * lista onde admin/professor possa precisar entrar em contato (turma,
 * risco de reprovação, faltas). Não renderiza nada se não tiver telefone
 * cadastrado. */
export function WhatsAppLink({ telefone, nome }: { telefone: string | null; nome?: string }) {
  if (!telefone) return null;

  return (
    <a
      href={linkWhatsApp(telefone)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Chamar ${nome ?? "pessoa"} no WhatsApp`}
      className="inline-flex items-center gap-1 text-xs text-ok hover:underline whitespace-nowrap"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {telefone}
    </a>
  );
}
