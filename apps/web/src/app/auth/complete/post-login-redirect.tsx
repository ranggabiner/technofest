"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PostLoginRedirect({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    waitForNextStyles().then(() => {
      if (cancelled) return;
      router.replace(nextPath);
    });

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  return null;
}

async function waitForNextStyles() {
  if (typeof document === "undefined") return;

  const stylesheetLinks = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  ).filter((link) => link.href.includes("/_next/static/"));

  await Promise.race([
    Promise.all(stylesheetLinks.map(waitForStylesheetLink)),
    delay(1500),
  ]);

  await waitForAnimationFrame();
  await waitForAnimationFrame();
}

function waitForStylesheetLink(link: HTMLLinkElement) {
  if (link.sheet) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", finish, { once: true });
  });
}

function delay(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
