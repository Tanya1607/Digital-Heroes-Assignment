import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function adminClient() {
  if (cached) return cached;
  cached = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}
