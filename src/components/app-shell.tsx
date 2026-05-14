import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-r border-[var(--color-stone-surface)] bg-white px-5 py-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-[var(--color-midnight)]">
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-teal-muted)]">
            <ShieldCheck size={18} />
          </span>
          MedProof
        </Link>
        <nav className="mt-8 grid gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--color-graphite)] hover:bg-[var(--color-parchment-card)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>
        <header className="border-b border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-6 py-4">
          <h1 className="text-xl font-semibold text-[var(--color-midnight)]">{title}</h1>
        </header>
        <div className="mx-auto max-w-[860px] px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
