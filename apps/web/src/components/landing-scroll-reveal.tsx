"use client";

import { useEffect } from "react";

const revealSelector = "[data-scroll-reveal]";
const readyAttribute = "data-scroll-reveal-ready";
const visibleAttribute = "data-scroll-reveal-visible";

export function LandingScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElement = (element: HTMLElement) => {
      element.setAttribute(visibleAttribute, "true");
    };
    const collectRevealElements = (node: Node) => {
      if (!(node instanceof HTMLElement)) {
        return [];
      }

      const elements = node.matches(revealSelector) ? [node] : [];
      elements.push(...Array.from(node.querySelectorAll<HTMLElement>(revealSelector)));

      return elements;
    };
    const createRefreshObserver = (observeRevealElements: (elements: readonly HTMLElement[]) => void) => {
      if (!("MutationObserver" in window)) {
        return null;
      }

      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            observeRevealElements(collectRevealElements(node));
          });
        });
      });

      mutationObserver.observe(document.body ?? root, {
        childList: true,
        subtree: true,
      });

      return mutationObserver;
    };

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      const observeRevealElements = (elements: readonly HTMLElement[]) => {
        elements.forEach(revealElement);
      };
      const mutationObserver = createRefreshObserver(observeRevealElements);

      observeRevealElements(Array.from(document.querySelectorAll<HTMLElement>(revealSelector)));
      root.setAttribute(readyAttribute, "true");

      return () => {
        mutationObserver?.disconnect();
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
    const observedElements = new WeakSet<HTMLElement>();
    const observeRevealElements = (elements: readonly HTMLElement[]) => {
      elements.forEach((element) => {
        if (element.getAttribute(visibleAttribute) === "true" || observedElements.has(element)) {
          return;
        }

        observedElements.add(element);
        observer.observe(element);
      });
    };

    observeRevealElements(Array.from(document.querySelectorAll<HTMLElement>(revealSelector)));

    const mutationObserver = createRefreshObserver(observeRevealElements);

    const frameId = window.requestAnimationFrame(() => {
      root.setAttribute(readyAttribute, "true");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      mutationObserver?.disconnect();
      root.removeAttribute(readyAttribute);
    };
  }, []);

  return null;
}
