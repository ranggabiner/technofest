"use client";

import { useEffect } from "react";

const revealSelector = "[data-scroll-reveal]";
const readyAttribute = "data-scroll-reveal-ready";
const visibleAttribute = "data-scroll-reveal-visible";

export function LandingScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (revealElements.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElement = (element: HTMLElement) => {
      element.setAttribute(visibleAttribute, "true");
    };

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach(revealElement);
      root.setAttribute(readyAttribute, "true");

      return () => {
        root.removeAttribute(readyAttribute);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          revealElement(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    const frameId = window.requestAnimationFrame(() => {
      root.setAttribute(readyAttribute, "true");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      root.removeAttribute(readyAttribute);
    };
  }, []);

  return null;
}
