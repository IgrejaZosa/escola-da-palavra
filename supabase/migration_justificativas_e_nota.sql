-- Migração: nova tabela de justificativas de falta + nota em escala 0-100.
-- Rode este arquivo inteiro uma vez no SQL Editor do Supabase (projeto
-- existente). Só faz alterações aditivas (alargar colunas, criar tabela) -
-- nenhum dado é apagado.

alter table cursos alter column nota_minima type numeric(5,2);
alter table cursos alter column nota_minima set default 60;

alter table matriculas alter column nota type numeric(5,2);

create table if not exists justificativas (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  encontro_id uuid not null references encontros(id) on delete cascade,
  motivo text not null check (motivo in ('ministerio', 'atestado', 'trabalho')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'rejeitada')),
  validado_por uuid references usuarios(id) on delete set null,
  validado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (matricula_id, encontro_id)
);
create index if not exists justificativas_matricula_id_idx on justificativas(matricula_id);
create index if not exists justificativas_status_idx on justificativas(status);

alter table justificativas enable row level security;
create policy "leitura publica" on justificativas for select using (true);
