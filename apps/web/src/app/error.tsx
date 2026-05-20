"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

import { motion } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--color-warm-canvas)] px-4 py-16 text-[var(--color-graphite)]">
      <section
        role="alert"
        className="grid w-full max-w-xl gap-6 rounded-xl border border-[var(--color-stone-surface)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-subtle)] sm:p-8"
      >
        <div className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-error-red)]">
            Terjadi kesalahan
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--color-charcoal-primary)]">
            Halaman belum bisa dimuat.
          </h1>
          <p className="text-sm leading-6 text-[var(--color-graphite)]">
            Koneksi atau layanan sedang bermasalah. Muat ulang halaman atau kembali ke beranda.
          </p>
          {error.digest ? (
            <p className="text-xs text-[var(--color-ash)]">Kode: {error.digest}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-teal-deep)] px-5 text-sm font-semibold text-[var(--color-inverted)] hover:bg-[var(--color-teal-primary)]",
              motion.button,
            )}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Coba lagi
          </button>
          <Link
            href="/"
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-card)] px-5 text-sm font-semibold text-[var(--color-teal-deep)] hover:bg-[var(--color-teal-surface)]",
              motion.button,
            )}
          >
            <Home size={16} aria-hidden="true" />
            Ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
