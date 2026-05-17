type ScrollToTopTarget = {
  matchMedia?: (query: string) => { matches: boolean };
  scrollTo: (options: ScrollToOptions) => void;
};

export function getLandingScrollBehavior(target: Pick<ScrollToTopTarget, "matchMedia">): ScrollBehavior {
  return target.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function scrollToLandingTop(target: ScrollToTopTarget = window): void {
  target.scrollTo({
    top: 0,
    behavior: getLandingScrollBehavior(target),
  });
}
