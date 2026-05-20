import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";

import { SharedHeader } from "@/components/shared-header";
import { SiteFooter } from "@/components/site-footer";
import { motion } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
      <SharedHeader authMode="public" />
      <main className="mx-auto grid min-h-[72dvh] w-full max-w-[760px] content-center gap-6 px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--color-teal-surface)] text-[var(--color-teal-deep)]">
          <Newspaper size={24} aria-hidden="true" />
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-ash)]">
            404
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--color-charcoal-primary)] sm:text-4xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--color-graphite)]">
            Tautan ini mungkin sudah dipindahkan atau tidak tersedia.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-teal-deep)] px-5 text-sm font-semibold text-[var(--color-inverted)] hover:bg-[var(--color-teal-primary)]",
              motion.button,
            )}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Ke beranda
          </Link>
          <Link
            href="/articles"
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-5 text-sm font-semibold text-[var(--color-teal-deep)] hover:bg-[var(--color-teal-surface)]",
              motion.button,
            )}
          >
            Baca artikel
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
