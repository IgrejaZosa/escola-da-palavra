import { Logo } from "@/components/Logo";
import { AlunoBusca } from "@/components/AlunoBusca";

export default function AlunoBuscaPage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 gap-6">
      <Logo heightClassName="h-12" />
      <div className="text-center">
        <h1 className="text-lg font-semibold text-zosa-ink">Minha frequência</h1>
        <p className="text-sm text-zosa-muted">Busque seu nome pra ver sua frequência e os materiais do seu curso.</p>
      </div>
      <AlunoBusca />
    </main>
  );
}
