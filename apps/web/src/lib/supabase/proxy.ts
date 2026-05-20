import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseAuthCookie, isSupabaseAuthCookieName } from "@/lib/supabase/auth-cookies";
import type { Database } from "@/lib/supabase/database.types";

export { isSupabaseAuthCookieName };

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const authResult = await supabase.auth.getClaims().catch((error: unknown) => ({
    data: { claims: null },
    error,
  }));

  if (isSupabaseStaleSessionError(authResult.error)) {
    response = clearSupabaseAuthCookies(request, response);
  }

  return response;
}

export function isSupabaseRefreshTokenMissingError(error: unknown) {
  return isSupabaseAuthErrorCode(error, "refresh_token_not_found");
}

export function isSupabaseStaleSessionError(error: unknown) {
  return (
    isSupabaseAuthErrorCode(error, "refresh_token_not_found")
    || isSupabaseAuthErrorCode(error, "user_not_found")
  );
}

function isSupabaseAuthErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === code
  );
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const authCookies = request.cookies.getAll().filter((cookie) => isSupabaseAuthCookieName(cookie.name));
  if (authCookies.length === 0) return response;

  authCookies.forEach(({ name }) => request.cookies.delete(name));
  const clearedResponse = NextResponse.next({ request });
  authCookies.forEach(({ name }) => {
    clearedResponse.cookies.set(name, "", {
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });
  });

  return clearedResponse;
}
