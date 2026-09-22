"use client";

import { createContext, useContext } from "react";
import type { TurmaComCurso, Usuario } from "@/lib/types";

interface ProfessorSessionData {
  usuario: Usuario;
  turmas: TurmaComCurso[];
}

const ProfessorSessionContext = createContext<ProfessorSessionData | null>(null);

export function ProfessorSessionProvider({
  value,
  children,
}: {
  value: ProfessorSessionData;
  children: React.ReactNode;
}) {
  return <ProfessorSessionContext.Provider value={value}>{children}</ProfessorSessionContext.Provider>;
}

export function useProfessorSession(): ProfessorSessionData {
  const ctx = useContext(ProfessorSessionContext);
  if (!ctx) throw new Error("useProfessorSession deve ser usado dentro de <ProfessorSessionProvider>");
  return ctx;
}
