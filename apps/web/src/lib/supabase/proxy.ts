import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/database.types";

export async function updateSession(request: NextRequest) {
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

  const authResult = await supabase.auth.getUser().catch((error: unknown) => ({
    data: { user: null },
    error,
  }));

  if (isSupabaseRefreshTokenMissingError(authResult.error)) {
    response = clearSupabaseAuthCookies(request, response);
  }

  return response;
}

export function isSupabaseRefreshTokenMissingError(error: unknown) {
  return (
    typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "refresh_token_not_found"
  );
}

export function isSupabaseAuthCookieName(name: string) {
  return name.startsWith("sb-") && /-auth-token(?:\.\d+)?$/.test(name);
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
