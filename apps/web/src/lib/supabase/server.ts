import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { requireEnv } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
  const env = requireEnv(["core"]);
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.data.NEXT_PUBLIC_SUPABASE_URL,
    env.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; proxy handles refresh writes.
          }
        },
      },
    },
  );
}
