import Link from "next/link";
import { IconExternal } from "@/components/ui/Icons";
import { bolAffiliateUrl } from "@/lib/bol";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";

/**
 * "Order at bol.com" - the affiliate link. Marked rel="sponsored" (Google's requirement for paid
 * links) and always accompanied by a plain-language disclosure.
 */
export function OrderCard({ ean, name, bolUrl, lang, t }: { ean: string; name: string; bolUrl?: string; lang: Locale; t: TFunction }) {
  const href = bolAffiliateUrl({ ean, name, bolUrl }, `scanabowl-${lang}-product`);
  return (
    <section aria-labelledby="order-h" className="rounded-2xl border border-line bg-paper p-6 shadow-card">
      <h2 id="order-h" className="font-display text-xl font-semibold text-brand-deep">{t("order.title")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("order.text")}</p>
      <a
        href={href}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-bol px-5 py-3.5 text-base font-semibold text-white shadow transition hover:brightness-110"
      >
        {t("order.button")}
        <IconExternal className="h-4 w-4" />
      </a>
      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        {t("order.disclosure")}{" "}
        <Link href={localePath(lang, "/affiliate")} className="underline underline-offset-2 hover:text-brand">{t("order.moreInfo")}</Link>
      </p>
      {lang !== "nl" && <p className="mt-2 text-xs text-ink-faint">{t("order.dutchOnly")}</p>}
    </section>
  );
}
