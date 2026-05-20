import { BrandScrollTopButton } from "@/components/brand-scroll-top-button";
import { motion } from "@/components/ui/motion";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const contactEmail = "medproof@binerlabs.com";

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
      className="w-full bg-[var(--color-card)] px-4 pb-8 pt-14 text-[var(--color-graphite)] sm:px-6 sm:pb-10 sm:pt-20"
    >
      <div className="mx-auto mb-8 flex w-full max-w-[1100px] flex-col items-start justify-between gap-8 border-b border-[var(--color-stone-surface)] pb-8 sm:mb-10 sm:gap-10 sm:pb-10 md:flex-row">
        <div data-scroll-reveal="" data-scroll-reveal-group="footer-brand" className="flex w-full max-w-md flex-col gap-6">
          <BrandScrollTopButton
            brand={copy.common.brand}
            brandClassName="text-2xl font-semibold leading-none tracking-tight text-[var(--color-midnight)]"
            className="flex cursor-pointer items-center gap-2"
            logoClassName="h-10 w-auto object-contain"
            logoSrc="/assets/landing/logo.webp"
            scrollToTopLabel={copy.common.scrollToTop}
          />
          <p className="text-sm leading-6 text-[var(--color-graphite)]">{landing.footer.description}</p>
        </div>
        <div data-scroll-reveal="" data-scroll-reveal-group="footer-contact" className="flex w-full max-w-sm flex-col gap-3 md:w-auto md:items-end md:text-right">
          <p className="text-sm font-semibold leading-6 text-[var(--color-midnight)]">{landing.footer.contactTitle}</p>
          <a
            className={cn("break-words text-sm font-medium leading-6 text-[var(--color-graphite)] underline-offset-4 hover:text-[var(--color-midnight)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-midnight)]", motion.navLink)}
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
        </div>
      </div>
      <p
        className="mx-auto w-full max-w-[1100px] text-center text-sm text-[color-mix(in_srgb,var(--color-graphite)_70%,transparent)]"
      >
        {copy.common.copyright}
      </p>
    </footer>
  );
}
