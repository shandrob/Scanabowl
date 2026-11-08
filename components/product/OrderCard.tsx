import type { TFunction } from "@/lib/i18n/t";
import { packGrams } from "@/lib/pets/energy";

/**
 * Reference price card on product detail pages (without external store affiliate buttons).
 */
export function OrderCard({
  pack,
  price,
  t,
}: {
  pack?: string;
  price?: number;
  t: TFunction;
}) {
  if (price === undefined || price <= 0) return null;
  const grams = pack ? packGrams(pack) : null;
  const perKg = grams && grams > 0 ? (price / (grams / 1000)).toFixed(2) : null;
  return (
    <section aria-labelledby="order-h" className="rounded-2xl border border-line bg-paper p-5 shadow-card">
      <h2 id="order-h" className="font-sans text-xs font-semibold text-ink-soft">
        {t("order.priceLabel")}{pack ? ` · ${pack}` : ""}
      </h2>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl font-semibold tabular-nums text-ink">€{price.toFixed(2)}</span>
        {perKg && (
          <span className="rounded-full bg-cream px-2.5 py-1 font-sans text-xs font-semibold tabular-nums text-ink-soft">
            {t("order.perKg", { price: perKg })}
          </span>
        )}
      </div>
    </section>
  );
}
