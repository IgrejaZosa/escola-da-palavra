export type Horario = "08h" | "16h30";

export const HORARIOS: Horario[] = ["08h", "16h30"];

export type Papel = "professor" | "admin";

export type StatusMatricula = "ativo" | "cancelado" | "transferido";

export type TipoMaterial = "slide" | "apostila" | "outro";

export const TIPO_MATERIAL_LABELS: Record<TipoMaterial, string> = {
  slide: "Slide",
  apostila: "Apostila",
  outro: "Outro",
};

export interface Rodada {
  id: string;
  nome: string;
  data_inicio: string; // ISO date
  data_fim: string; // ISO date
  ativa: boolean;
  created_at: string;
}

export interface Curso {
  id: string;
  rodada_id: string;
  nome: string;
  descricao: string | null;
  nota_minima: number;
  created_at: string;
}

export interface Turma {
  id: string;
  curso_id: string;
  horario: Horario;
  created_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  papel: Papel;
  cor: string;
  created_at: string;
}

export interface Encontro {
  id: string;
  turma_id: string;
  numero: number;
  data: string; // ISO date
  created_at: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  created_at: string;
}

export interface Matricula {
  id: string;
  pessoa_id: string;
  turma_id: string;
  rodada_id: string;
  status: StatusMatricula;
  nota: number | null;
  created_at: string;
}

export interface Presenca {
  id: string;
  matricula_id: string;
  encontro_id: string;
  presente: boolean;
  marcado_em: string;
}

export interface Material {
  id: string;
  curso_id: string;
  usuario_id: string | null;
  titulo: string;
  tipo: TipoMaterial;
  arquivo_url: string;
  created_at: string;
}

export type MotivoJustificativa = "ministerio" | "atestado" | "trabalho";
export type StatusJustificativa = "pendente" | "aprovada" | "rejeitada";

export const MOTIVO_JUSTIFICATIVA_LABELS: Record<MotivoJustificativa, string> = {
  ministerio: "Servindo em ministério",
  atestado: "Atestado médico",
  trabalho: "Trabalho",
};

export interface Justificativa {
  id: string;
  matricula_id: string;
  encontro_id: string;
  motivo: MotivoJustificativa;
  status: StatusJustificativa;
  validado_por: string | null;
  validado_em: string | null;
  created_at: string;
}

export const STATUS_JUSTIFICATIVA_LABELS: Record<StatusJustificativa, string> = {
  pendente: "Aguardando validação do admin",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export const STATUS_JUSTIFICATIVA_COLORS: Record<StatusJustificativa, { fg: string; bg: string }> = {
  pendente: { fg: "var(--color-warn)", bg: "var(--color-warn-bg)" },
  aprovada: { fg: "var(--color-ok)", bg: "var(--color-ok-bg)" },
  rejeitada: { fg: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

// ─── Tipos compostos usados nas telas ───────────────────────────────────────

export interface TurmaComCurso extends Turma {
  curso: Curso;
}

export interface MatriculaComPessoa extends Matricula {
  pessoa: Pessoa;
}
