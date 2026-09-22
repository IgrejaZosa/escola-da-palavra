import { Logo } from "@/components/Logo";

/** Faixa azul-petróleo full-bleed com o logo branco — usada no topo das
 * páginas públicas (aluno, checkin) em vez de soltar o selo teal do logo
 * original direto no fundo creme da página. */
export function LogoBand({ heightClassName = "h-16" }: { heightClassName?: string }) {
  return (
    <div className="bg-ep-dark w-full flex items-center justify-center py-8 px-4">
      <Logo heightClassName={heightClassName} variant="white" />
    </div>
  );
}
