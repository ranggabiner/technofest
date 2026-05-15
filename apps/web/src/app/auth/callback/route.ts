import { NextResponse } from "next/server";

import { resolveRoleForUser } from "@/lib/auth/session";
import { roleEntryPath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type AuthCallbackError =
  | "oauth_missing_code"
  | "oauth_exchange_failed"
  | "oauth_user_missing"
  | "oauth_callback_failed";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectToLoginError(request, "oauth_missing_code");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLoginError(request, "oauth_exchange_failed");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return redirectToLoginError(request, "oauth_user_missing");
    }

    const role = await resolveRoleForUser(user, { clearIntentCookie: true });
    const redirectPath = role ? roleEntryPath(role) : "/login/role";

    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch {
    return redirectToLoginError(request, "oauth_callback_failed");
  }
}

function redirectToLoginError(request: Request, error: AuthCallbackError) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}
