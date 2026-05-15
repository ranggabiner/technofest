import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getMarketingFooterLinks } from "@/lib/i18n/marketing";

export async function MarketingFooter() {
  const locale = await getLocale();
  const copy = await getDictionary();
  const footerLinks = getMarketingFooterLinks(locale);

  return (
    <footer className="border-t border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] py-12">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <p className="text-center text-[12px] leading-5 text-[var(--color-graphite)]">
          {copy.common.copyright}
        </p>
        <div className="flex items-center gap-6">
          {footerLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              className="cursor-pointer text-[12px] leading-5 text-[var(--color-ash)] opacity-80 transition hover:text-[var(--color-midnight)] hover:opacity-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
