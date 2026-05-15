import { createClient } from "@supabase/supabase-js";

import { requireEnv } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient() {
  const env = requireEnv(["core"]);

  return createClient<Database>(env.data.NEXT_PUBLIC_SUPABASE_URL, env.data.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
