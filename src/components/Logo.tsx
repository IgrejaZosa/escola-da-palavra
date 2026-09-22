import Image from "next/image";

export function Logo({
  heightClassName = "h-9",
  variant = "color",
}: {
  heightClassName?: string;
  /** "white" usa a versão com fundo transparente e ícone/texto brancos
   * (gerada a partir do logo original), pra usar sobre fundos escuros em
   * vez do selo teal sólido. */
  variant?: "color" | "white";
}) {
  return (
    <Image
      src={variant === "white" ? "/logo-white.png" : "/logo.png"}
      alt="Escola da Palavra"
      width={220}
      height={90}
      className={`${heightClassName} w-auto`}
      priority
    />
  );
}
