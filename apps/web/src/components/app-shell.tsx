import Link from "next/link";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooterContent } from "@/components/site-footer";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: Array<{ href: string; label: string; active?: boolean }>;
  children: React.ReactNode;
}) {
  const copy = await getDictionary();

  return (
    <div className="min-h-screen">
      <SharedHeader
        authMode="authenticated"
        contextTitle={title}
        isAuthenticated
        maxWidth="none"
        position="sticky"
      />
      <div className={cn("min-h-[calc(100vh-4rem)]", nav.length > 0 && "md:grid md:grid-cols-[260px_1fr]")}>
        {nav.length > 0 ? (
          <aside className="border-b border-[var(--color-stone-surface)] bg-[var(--color-card)] px-5 py-3 md:border-b-0 md:border-r md:py-6">
            <nav
              className="flex gap-2 overflow-x-auto pb-1 md:grid md:overflow-visible md:pb-0"
              aria-label={copy.appShell.mainNavLabel}
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-parchment-card)]",
                    item.active && "bg-[var(--color-teal-muted)] text-[var(--color-midnight)]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        ) : null}
        <main>
          <h1 className="sr-only">{title}</h1>
          <div className="mx-auto max-w-[860px] px-6 py-8">{children}</div>
        </main>
      </div>
      <SiteFooterContent copy={copy} />
    </div>
  );
}
