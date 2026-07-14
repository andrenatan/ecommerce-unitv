import { createClient } from '@supabase/supabase-js';

// NUNCA expor no cliente — bypassa RLS. Usar apenas em Route Handlers/Server Actions.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
