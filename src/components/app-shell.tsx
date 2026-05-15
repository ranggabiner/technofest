import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: Array<{ href: string; label: string; active?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--color-stone-surface)] bg-white px-5 py-5 md:border-b-0 md:border-r md:py-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-[var(--color-midnight)]">
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-teal-muted)]">
            <ShieldCheck size={18} />
          </span>
          MedProof
        </Link>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 md:mt-8 md:grid md:overflow-visible md:pb-0">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-parchment-card)]",
                item.active && "bg-[var(--color-teal-muted)] text-[var(--color-midnight)]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>
        <header className="border-b border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-6 py-4 md:min-h-14">
          <h1 className="text-xl font-semibold leading-7 text-[var(--color-midnight)]">{title}</h1>
        </header>
        <div className="mx-auto max-w-[860px] px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
