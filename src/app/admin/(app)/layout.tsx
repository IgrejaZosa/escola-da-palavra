import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { AdminSessionProvider } from "@/lib/admin-session";
import { AdminHeader } from "@/components/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioAtual("admin");
  if (!usuario) redirect("/admin/quem-e-voce");

  return (
    <AdminSessionProvider value={{ usuario }}>
      <AdminHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </AdminSessionProvider>
  );
}
