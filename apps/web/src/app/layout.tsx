import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { RouteTransitionProvider } from "@/components/route-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appThemeInitScript = `
(function(){
  try {
    var storageKey="medproof_theme";
    var stored=window.localStorage.getItem(storageKey);
    var theme=stored==="dark"||stored==="light"
      ? stored
      : window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.setAttribute("data-theme",theme);
    document.documentElement.style.colorScheme=theme;
  } catch (error) {
  }
})();
`;

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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
        <script dangerouslySetInnerHTML={{ __html: appThemeInitScript }} />
        <ThemeProvider>
          <div id="app-shell" data-app-shell>
            <Suspense fallback={children}>
              <RouteTransitionProvider>
                {children}
              </RouteTransitionProvider>
            </Suspense>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
