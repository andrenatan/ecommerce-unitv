import { createClient } from "@/lib/supabase/server";

/**
 * Verifica se o usuário autenticado é admin. Usar em toda API route de /api/admin/*
 * — o proxy.ts já bloqueia no nível de rota, mas cada handler valida de novo
 * (regra do CLAUDE.md: dupla validação de role admin).
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }

  return user;
}
