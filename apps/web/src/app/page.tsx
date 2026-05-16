import { SharedHeader } from "@/components/shared-header";
import { redirectAuthenticatedUserFromPublicRoute } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await redirectAuthenticatedUserFromPublicRoute();

  const copy = await getDictionary();

  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)]">
      <SharedHeader authMode="public" />
      <main className="grid min-h-screen place-items-center px-6 pt-16">
        <h1 className="font-serif text-[56px] font-medium leading-none text-[var(--color-midnight)] md:text-[88px]">
          {copy.common.brand}
        </h1>
      </main>
    </div>
  );
}
