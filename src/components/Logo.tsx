import Image from "next/image";

export function Logo({ heightClassName = "h-9" }: { heightClassName?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Escola da Palavra"
      width={220}
      height={90}
      className={`${heightClassName} w-auto`}
      priority
    />
  );
}
