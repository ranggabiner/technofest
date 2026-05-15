import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getDictionary();

  return {
    title: copy.common.brand,
    description: copy.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
