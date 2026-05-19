"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import { postLoginHandoffPath } from "@/lib/auth/post-login";
import { roleEntryPath } from "@/lib/auth/roles";
import { completeRoleForUser, requireCurrentUser, resolveRoleForUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { roleIntentCookie, parseAuthIntent } from "@/lib/auth/intent";

const allowedManualDemoEmails = new Set([
  "dokter@test.com",
  "pasien@test.com",
  "superadmin@test.com",
  "admin@test.com",
]);

export async function startGoogleOAuthAction() {
  const cookieStore = await cookies();
  cookieStore.delete(roleIntentCookie);

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) redirect("/login/real?error=oauth_start_failed");
  redirect(data.url);
}

export async function startManualLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!allowedManualDemoEmails.has(email) || !password) {
    redirect("/login/demo?error=manual_invalid");
  }

  const cookieStore = await cookies();
  cookieStore.delete(roleIntentCookie);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/login/demo?error=manual_invalid");
  }

  const role = await resolveRoleForUser(data.user, { clearIntentCookie: true });
  if (!role) {
    await supabase.auth.signOut();
    redirect("/login/demo?error=manual_invalid");
  }

  redirect(postLoginHandoffPath(roleEntryPath(role)));
}

export async function completeRoleSelectionAction(formData: FormData) {
  const intent = parseAuthIntent(String(formData.get("intent") ?? ""));
  if (!intent) redirect("/login/role?error=invalid_role");

  const user = await requireCurrentUser();
  const role = await completeRoleForUser(user, intent);
  const cookieStore = await cookies();
  cookieStore.delete(roleIntentCookie);

  redirect(postLoginHandoffPath(roleEntryPath(role)));
}

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
