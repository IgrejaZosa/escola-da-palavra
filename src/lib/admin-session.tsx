"use client";

import { createContext, useContext } from "react";
import type { Usuario } from "@/lib/types";

interface AdminSessionData {
  usuario: Usuario;
}

const AdminSessionContext = createContext<AdminSessionData | null>(null);

export function AdminSessionProvider({ value, children }: { value: AdminSessionData; children: React.ReactNode }) {
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSessionData {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error("useAdminSession deve ser usado dentro de <AdminSessionProvider>");
  return ctx;
}
