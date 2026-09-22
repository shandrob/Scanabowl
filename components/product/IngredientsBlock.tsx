import type { ProductDetail } from "@/lib/data/types";
import type { TFunction } from "@/lib/i18n/t";
import { kindGroup, type KindGroup } from "@/lib/labels";

const GROUP_STYLE: Record<KindGroup, { chip: string; bar: string }> = {
  animal: { chip: "border-grade-a/30 bg-grade-a-soft text-ink", bar: "#15803d" },
  fat: { chip: "border-sky-300/50 bg-sky-50 text-ink", bar: "#38bdf8" },
  plant: { chip: "border-grade-c/30 bg-grade-c-soft text-ink", bar: "#ca8a04" },
  other: { chip: "border-line bg-cream text-ink-soft", bar: "#94a3b8" },
};

export function IngredientsBlock({ p, t }: { p: ProductDetail; t: TFunction }) {
  // an unreliable ingredient text (see scoring) is not shown or broken down at all
  if (!p.ingredients.length || p.notScored === "ingredients_unclear") {
    return <p className="text-ink-soft">{t("product.noIngredients")}</p>;
  }
  const totals: Record<KindGroup, number> = { animal: 0, fat: 0, plant: 0, other: 0 };
  for (const i of p.ingredients) totals[kindGroup(i.kind)] += i.share;
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const order: KindGroup[] = ["animal", "fat", "plant", "other"];

  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-line/60" role="img" aria-label={order.map((g) => `${t(`product.group.${g}`)} ${Math.round((totals[g] / sum) * 100)}%`).join(", ")}>
        {order.map((g) => (
          <div key={g} style={{ width: `${(totals[g] / sum) * 100}%`, background: GROUP_STYLE[g].bar }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        {order.map((g) => (
          <li key={g} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GROUP_STYLE[g].bar }} aria-hidden />
            {t(`product.group.${g}`)} ≈ {Math.round((totals[g] / sum) * 100)}%
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-ink-faint">{t("product.estimateNote")}</p>

      <ol className="mt-5 flex flex-wrap gap-2">
        {p.ingredients.map((i, idx) => (
          <li key={`${i.raw}-${idx}`} className={`rounded-lg border px-2.5 py-1 text-sm ${GROUP_STYLE[kindGroup(i.kind)].chip}`}>
            <span className="mr-1.5 font-mono text-[0.65rem] text-ink-faint">{idx + 1}</span>
            {i.raw}
            {i.pct !== undefined && <span className="ml-1 font-mono text-xs text-ink-soft">{i.pct}%</span>}
          </li>
        ))}
      </ol>

      <details className="mt-5 rounded-xl border border-line bg-cream/60 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-brand-deep">{t("product.originalText")}</summary>
        <p className="mt-2 leading-relaxed text-ink-soft">{p.ingredientsText}</p>
        <p className="mt-2 text-xs text-ink-faint">{t("product.originalLanguageNote")}</p>
      </details>
    </div>
  );
}
