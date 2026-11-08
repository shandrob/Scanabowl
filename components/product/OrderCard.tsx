import Link from "next/link";
import { IconExternal } from "@/components/ui/Icons";
import { bolAffiliateUrl } from "@/lib/bol";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { packGrams } from "@/lib/pets/energy";
import { zooplusLink } from "@/lib/zooplus";

/**
 * "Where to buy" - affiliate links to zooplus (via Awin) and bol.com. Marked rel="sponsored" (Google's
 * requirement for paid links) and always accompanied by a plain-language disclosure.
 */
export function OrderCard({
  ean,
  name,
  brand,
  pack,
  price,
  bolUrl,
  zooplusUrl,
  lang,
  t,
}: {
  ean: string;
  name: string;
  brand: string;
  pack?: string;
  price?: number;
  bolUrl?: string;
  zooplusUrl?: string;
  lang: Locale;
  t: TFunction;
}) {
  const zooplus = zooplusLink({ brand, name, zooplusUrl }, `scanabowl-${lang}-${ean || "product"}`);
  const bol = bolAffiliateUrl({ ean, name, bolUrl }, `scanabowl-${lang}-product`);
  const rel = "sponsored nofollow noopener noreferrer";
  const grams = pack ? packGrams(pack) : null;
  const perKg = price && grams && grams > 0 ? (price / (grams / 1000)).toFixed(2) : null;
  return (
    <section aria-labelledby="order-h" className="rounded-sm border-2 border-ink bg-paper p-6 shadow-lift">
      <div className="border-b-4 border-ink pb-2">
        <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-widest text-ink-soft">PRICE & RETAIL LEDGER</p>
        <h2 id="order-h" className="font-display text-xl font-semibold tracking-tight text-ink">{t("order.title")}</h2>
      </div>
      <p className="mt-2.5 text-sm text-ink-soft">{t("order.text")}</p>
      {price !== undefined && price > 0 && (
        <div className="mt-4 flex items-baseline justify-between rounded-sm border border-ink bg-stone px-4 py-3">
          <div>
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-soft">
              {t("order.priceLabel")}{pack ? ` · ${pack}` : ""}
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-ink">€{price.toFixed(2)}</span>
          </div>
          {perKg && (
            <span className="rounded-sm border border-ink bg-paper px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-ink">
              {t("order.perKg", { price: perKg })}
            </span>
          )}
        </div>
      )}
      <a
        href={zooplus.url}
        target="_blank"
        rel={rel}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-ink bg-brand px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-brand-deep"
      >
        {zooplus.exact ? t("order.zooplusExact") : t("order.zooplusButton")}
        <IconExternal className="h-4 w-4" />
      </a>
      <a
        href={bol}
        target="_blank"
        rel={rel}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-bol bg-paper px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-bol transition hover:bg-bol/5"
      >
        {t("order.button")}
        <IconExternal className="h-4 w-4" />
      </a>
      <p className="mt-3 font-mono text-[0.7rem] leading-relaxed text-ink-faint">
        {t("order.disclosure")}{" "}
        <Link href={localePath(lang, "/affiliate")} className="underline underline-offset-2 hover:text-ink">{t("order.moreInfo")}</Link>
      </p>
      {lang !== "nl" && <p className="mt-2 font-mono text-[0.7rem] text-ink-faint">{t("order.dutchOnly")}</p>}
    </section>
  );
}
