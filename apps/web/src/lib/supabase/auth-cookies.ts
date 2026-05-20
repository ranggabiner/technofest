type CookieNameSource = {
  name: string;
};

export function isSupabaseAuthCookieName(name: string) {
  return name.startsWith("sb-") && /-auth-token(?:\.\d+)?$/.test(name);
}

export function hasSupabaseAuthCookie(cookies: readonly CookieNameSource[]) {
  return cookies.some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
