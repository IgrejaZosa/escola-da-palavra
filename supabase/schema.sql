-- Escola da Palavra — schema inicial
-- Rode este arquivo inteiro uma vez no SQL Editor do Supabase (projeto novo).

create extension if not exists "pgcrypto";

-- ─── Rodadas (semestres/turmas da Escola da Palavra) ───────────────────────
create table rodadas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  ativa boolean not null default false,
  created_at timestamptz not null default now(),
  constraint rodadas_datas_check check (data_fim > data_inicio)
);

-- ─── Cursos (os 3 cursos oferecidos numa rodada) ───────────────────────────
create table cursos (
  id uuid primary key default gen_random_uuid(),
  rodada_id uuid not null references rodadas(id) on delete cascade,
  nome text not null,
  descricao text,
  nota_minima numeric(4,2) not null default 7.0,
  created_at timestamptz not null default now()
);
create index cursos_rodada_id_idx on cursos(rodada_id);

-- ─── Turmas (curso x horário — cada curso sempre tem as duas) ──────────────
create table turmas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id) on delete cascade,
  horario text not null check (horario in ('08h', '16h30')),
  created_at timestamptz not null default now(),
  unique (curso_id, horario)
);
create index turmas_curso_id_idx on turmas(curso_id);

-- ─── Usuários (professores e administradores — login por senha de papel) ──
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  papel text not null check (papel in ('professor', 'admin')),
  cor text not null default '#287176',
  created_at timestamptz not null default now()
);

-- ─── Quais professores lecionam em qual turma ──────────────────────────────
create table turma_professores (
  turma_id uuid not null references turmas(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  primary key (turma_id, usuario_id)
);

-- ─── Encontros (um por domingo, por turma, dentro do período da rodada) ───
create table encontros (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  numero int not null,
  data date not null,
  created_at timestamptz not null default now(),
  unique (turma_id, data)
);
create index encontros_turma_id_idx on encontros(turma_id);

-- ─── Pessoas (alunos, cadastrados via upload da planilha de inscrições) ────
create table pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  created_at timestamptz not null default now()
);
create index pessoas_nome_idx on pessoas (lower(nome));

-- ─── Matrículas (pessoa inscrita numa turma de uma rodada) ─────────────────
create table matriculas (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  rodada_id uuid not null references rodadas(id) on delete cascade,
  status text not null default 'ativo' check (status in ('ativo', 'cancelado', 'transferido')),
  nota numeric(4,2),
  created_at timestamptz not null default now(),
  unique (pessoa_id, turma_id)
);
create index matriculas_turma_id_idx on matriculas(turma_id);
create index matriculas_pessoa_id_idx on matriculas(pessoa_id);
create index matriculas_rodada_id_idx on matriculas(rodada_id);

-- ─── Presenças ──────────────────────────────────────────────────────────────
create table presencas (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  encontro_id uuid not null references encontros(id) on delete cascade,
  presente boolean not null default true,
  marcado_em timestamptz not null default now(),
  unique (matricula_id, encontro_id)
);
create index presencas_matricula_id_idx on presencas(matricula_id);
create index presencas_encontro_id_idx on presencas(encontro_id);

-- ─── Materiais (slides/apostilas postados pelos professores) ──────────────
create table materiais (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  titulo text not null,
  tipo text not null check (tipo in ('slide', 'apostila', 'outro')),
  arquivo_url text not null,
  created_at timestamptz not null default now()
);
create index materiais_curso_id_idx on materiais(curso_id);

-- ─── RLS: leitura liberada pra todo mundo (app é de baixo risco / uso
-- interno da igreja), escrita só via service role nas API routes ──────────
alter table rodadas enable row level security;
alter table cursos enable row level security;
alter table turmas enable row level security;
alter table usuarios enable row level security;
alter table turma_professores enable row level security;
alter table encontros enable row level security;
alter table pessoas enable row level security;
alter table matriculas enable row level security;
alter table presencas enable row level security;
alter table materiais enable row level security;

create policy "leitura publica" on rodadas for select using (true);
create policy "leitura publica" on cursos for select using (true);
create policy "leitura publica" on turmas for select using (true);
create policy "leitura publica" on usuarios for select using (true);
create policy "leitura publica" on turma_professores for select using (true);
create policy "leitura publica" on encontros for select using (true);
create policy "leitura publica" on pessoas for select using (true);
create policy "leitura publica" on matriculas for select using (true);
create policy "leitura publica" on presencas for select using (true);
create policy "leitura publica" on materiais for select using (true);

-- ─── Storage: bucket público para os materiais (slides/apostilas) ─────────
insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', true)
on conflict (id) do nothing;

-- ─── Seed: primeiro admin, pra existir alguém que consiga entrar e cadastrar
-- o resto (professores, outras rodadas etc.) pela própria tela /admin/usuarios.
insert into usuarios (nome, papel, cor) values ('Secretaria', 'admin', '#1c5b54');
