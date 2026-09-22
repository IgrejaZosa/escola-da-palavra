import { NextResponse, type NextRequest } from "next/server";

const COOKIE_ACESSO_PROFESSOR = "escola_acesso_professor";
const COOKIE_ACESSO_ADMIN = "escola_acesso_admin";
const COOKIE_USUARIO = "escola_usuario_id";

const LIVRES_SEMPRE = [
  "/api/acesso-professor",
  "/api/acesso-admin",
  "/api/professor/quem-sou-eu",
  "/api/admin/quem-sou-eu",
  "/professor/entrar",
  "/professor/quem-e-voce",
  "/admin/entrar",
  "/admin/quem-e-voce",
];

/** Alunos não têm senha nenhuma — /, /aluno e /checkin ficam totalmente
 * públicos (ver src/lib/auth.ts). Professor e admin entram com a senha do
 * próprio papel e depois escolhem o nome ("Quem é você?"), igual ao padrão
 * dos outros apps da Zōsa, só que com duas senhas em vez de uma. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (LIVRES_SEMPRE.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/professor") || pathname.startsWith("/api/professor")) {
    return checarAcesso(request, COOKIE_ACESSO_PROFESSOR, "/professor/entrar", "/professor/quem-e-voce");
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return checarAcesso(request, COOKIE_ACESSO_ADMIN, "/admin/entrar", "/admin/quem-e-voce");
  }

  return NextResponse.next();
}

function checarAcesso(request: NextRequest, cookieAcesso: string, rotaSenha: string, rotaEscolherUsuario: string) {
  const temAcesso = request.cookies.get(cookieAcesso)?.value === "ok";
  if (!temAcesso) return redirecionar(request, rotaSenha);

  const temUsuario = !!request.cookies.get(COOKIE_USUARIO)?.value;
  if (!temUsuario) return redirecionar(request, rotaEscolherUsuario);

  return NextResponse.next();
}

function redirecionar(request: NextRequest, destino: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = destino;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg)$).*)"],
};
