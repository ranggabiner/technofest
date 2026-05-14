import { NextResponse } from "next/server";

import { ensureRoleForUser } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_missing_code", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_exchange_failed", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=oauth_user_missing", request.url));
  }

  const role = await ensureRoleForUser(user, { clearIntentCookie: true });
  return NextResponse.redirect(new URL(roleHomePath(role), request.url));
}
