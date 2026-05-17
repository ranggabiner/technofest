import { BrandScrollTopButton } from "@/components/brand-scroll-top-button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";

export async function SiteFooter() {
  const copy = await getDictionary();

  return <SiteFooterContent copy={copy} />;
}

export function SiteFooterContent({ copy }: { copy: Dictionary }) {
  const landing = copy.marketing.landing;

  return (
    <footer
      data-scroll-reveal=""
      data-scroll-reveal-group="footer"
      data-site-footer=""
      className="w-full bg-[var(--color-card)] px-6 pb-10 pt-20 text-[var(--color-graphite)]"
    >
      <div className="mx-auto mb-10 flex w-full max-w-[1100px] flex-col items-start justify-between gap-10 border-b border-[var(--color-stone-surface)] pb-10 md:flex-row">
        <div data-scroll-reveal="" data-scroll-reveal-group="footer-brand" className="flex w-full max-w-md flex-col gap-6">
          <BrandScrollTopButton
            brand={copy.common.brand}
            brandClassName="font-serif text-[28px] font-bold leading-none text-[var(--color-midnight)]"
            className="flex cursor-pointer items-center gap-2"
            logoClassName="h-10 w-auto object-contain"
            logoSrc="/assets/landing/logo.webp"
            scrollToTopLabel={copy.common.scrollToTop}
          />
          <p className="text-[14px] leading-6 text-[var(--color-graphite)]">{landing.footer.description}</p>
        </div>
      </div>
      <p
        data-scroll-reveal=""
        data-scroll-reveal-group="footer-copyright"
        className="mx-auto w-full max-w-[1100px] text-center text-[14px] text-[color-mix(in_srgb,var(--color-graphite)_70%,transparent)]"
      >
        {copy.common.copyright}
      </p>
    </footer>
  );
}
