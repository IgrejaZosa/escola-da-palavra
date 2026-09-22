# Escola da Palavra

App de presença, frequência e notas da Escola da Palavra (Igreja Zōsa).

## Stack

Next.js 16 + Supabase (Postgres) + Netlify. Sem Supabase Auth — acesso de
professor/admin é uma senha por papel (env var) + escolher o próprio nome
("Quem é você?"); a área do aluno é totalmente pública (autoatendimento via
busca de nome ou QR code).

## Setup local

1. `npm install`
2. Rode `supabase/schema.sql` inteiro no SQL Editor de um projeto Supabase novo.
3. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API Keys)
   - `APP_SENHA_PROFESSOR`, `APP_SENHA_ADMIN` (senhas que você escolher)
4. `npm run dev`

O schema já cria um administrador "Secretaria" — entre em `/admin` com
`APP_SENHA_ADMIN` pra cadastrar o resto (professores, rodadas, cursos).

## Modelo

- **Rodada** → tem 1..N **cursos** (a Escola sempre roda com 3).
- Cada **curso** sempre tem duas **turmas** (08h e 16h30), criadas
  automaticamente ao cadastrar o curso.
- **Encontros** (um por domingo da rodada, por turma) são gerados de uma vez
  pelo botão "Gerar encontros" na tela da rodada.
- **Pessoas** viram **matrículas** numa turma — via importação da planilha
  de inscrições (Forms) ou cadastro manual.
- **Presença** é marcada pela própria pessoa via QR code (`/checkin/[turmaId]`,
  um QR fixo por turma, encontro do dia detectado automaticamente).
- Aprovação = frequência (máx. 3 faltas) **e** nota mínima do curso, a nota
  vindo da importação da planilha da prova. Ver `src/lib/frequencia.ts`.
