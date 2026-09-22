import { FileText, Presentation, File } from "lucide-react";
import { TIPO_MATERIAL_LABELS } from "@/lib/types";
import type { Material } from "@/lib/types";

const ICONES = {
  slide: Presentation,
  apostila: FileText,
  outro: File,
};

export function MateriaisList({ materiais }: { materiais: Material[] }) {
  if (materiais.length === 0) {
    return <p className="text-sm text-zosa-muted">Nenhum material postado ainda.</p>;
  }

  return (
    <ul className="space-y-2">
      {materiais.map((m) => {
        const Icone = ICONES[m.tipo];
        return (
          <li key={m.id}>
            <a
              href={m.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-3 flex items-center gap-3 hover:border-zosa-teal transition-colors"
            >
              <Icone className="h-5 w-5 text-zosa-teal shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zosa-ink truncate">{m.titulo}</p>
                <p className="text-xs text-zosa-muted">{TIPO_MATERIAL_LABELS[m.tipo]}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
