import { cookies } from "next/headers";

import { dictionary } from "./dictionary";
import { localeCookieName, parseLocale } from "./locales";

export async function getLocale() {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(localeCookieName)?.value);
}

export async function getDictionary() {
  const locale = await getLocale();
  return dictionary[locale];
}
