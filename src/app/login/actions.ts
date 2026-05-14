"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roleIntentCookie, parseAuthIntent } from "@/lib/auth/intent";

export async function startGoogleOAuthAction(formData: FormData) {
  const intent = parseAuthIntent(String(formData.get("intent") ?? ""));
  if (!intent) redirect("/login?error=invalid_role");

  const cookieStore = await cookies();
  cookieStore.set(roleIntentCookie, intent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

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

  if (error || !data.url) redirect("/login?error=oauth_start_failed");
  redirect(data.url);
}

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
