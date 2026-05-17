import { NextResponse } from "next/server";

import {
  getAuthCallbackError,
  getAuthCallbackErrorReason,
  type AuthCallbackError,
} from "@/lib/auth/callback";
import { resolveRoleForUser } from "@/lib/auth/session";
import { roleEntryPath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code") ?? "";
  const callbackError = getAuthCallbackError(requestUrl);

  if (callbackError) {
    return redirectToLoginError(request, callbackError, getAuthCallbackErrorReason(requestUrl));
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

function redirectToLoginError(request: Request, error: AuthCallbackError, reason?: string | null) {
  const loginUrl = new URL("/login/real", request.url);
  loginUrl.searchParams.set("error", error);
  if (reason) loginUrl.searchParams.set("reason", reason);
  return NextResponse.redirect(loginUrl);
}
