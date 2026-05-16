"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { roleIntentCookie } from "@/lib/auth/intent";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  const cookieStore = await cookies();
  cookieStore.delete(roleIntentCookie);

  if (error) redirect("/login?error=logout_failed");
  redirect("/login");
}
