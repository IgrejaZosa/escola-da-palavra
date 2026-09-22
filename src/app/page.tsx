import Link from "next/link";
import { Logo } from "@/components/Logo";

const ENTRADAS = [
  {
    href: "/aluno",
    titulo: "Sou aluno",
    descricao: "Ver minha frequência e os materiais do meu curso.",
  },
  {
    href: "/professor",
    titulo: "Sou professor",
    descricao: "Acompanhar minhas turmas e postar materiais.",
  },
  {
    href: "/admin",
    titulo: "Sou administrador",
    descricao: "Gerenciar rodadas, turmas, inscrições e notas.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-10">
      <Logo heightClassName="h-16" />
      <div className="w-full max-w-3xl grid sm:grid-cols-3 gap-4">
        {ENTRADAS.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="card p-5 flex flex-col gap-2 hover:border-zosa-teal hover:shadow-md transition-all"
          >
            <h2 className="text-base font-semibold text-zosa-ink">{e.titulo}</h2>
            <p className="text-sm text-zosa-muted">{e.descricao}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
