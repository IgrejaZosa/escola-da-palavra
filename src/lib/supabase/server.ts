import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente anon, para leituras do lado do servidor (Server Components e
 * páginas públicas como /aluno e /checkin). */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Cliente com a service role key, usado apenas em API routes de servidor
 * para escritas (create/update/delete) e upload de materiais. Centraliza as
 * regras de quem-pode-fazer-o-que no código da aplicação em vez de
 * duplicadas em RLS — o RLS cuida só da leitura (ver supabase/schema.sql). */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
