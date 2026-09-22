import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente do navegador. Sem Supabase Auth neste app — acesso de
 * professor/admin é controlado por cookies próprios (ver src/lib/auth.ts e
 * src/proxy.ts), e a área do aluno é pública. Isso é só um cliente anon. */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
