import type { ProductDetail } from "@/lib/data/types";
import type { TFunction } from "@/lib/i18n/t";
import { IconInfo } from "@/components/ui/Icons";
import { kindGroup, type KindGroup } from "@/lib/labels";
import { splitGroups } from "@/lib/scoring/splitting";

const GROUP_STYLE: Record<KindGroup, { chip: string; bar: string }> = {
  animal: { chip: "border-grade-a/40 bg-grade-a-soft text-ink", bar: "#2D6A4F" },
  fat: { chip: "border-brand/40 bg-stone text-ink", bar: "#1F4E3D" },
  plant: { chip: "border-warn/40 bg-warn-soft text-ink", bar: "#B45309" },
  other: { chip: "border-line bg-cream text-ink-soft", bar: "#6B6A65" },
};

/** additives a pet does not need: shown in red (they already cost points in the score) */
const UNNEEDED = new Set(["sugar", "colourant", "preservative"]);

export function IngredientsBlock({ p, t }: { p: ProductDetail; t: TFunction }) {
  // an unreliable ingredient text (see scoring) is not shown or broken down at all
  if (!p.ingredients.length || p.notScored === "ingredients_unclear") {
    return <p className="text-ink-soft">{t("product.noIngredients")}</p>;
  }
  const totals: Record<KindGroup, number> = { animal: 0, fat: 0, plant: 0, other: 0 };
  for (const i of p.ingredients) totals[kindGroup(i.kind)] += i.share;
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const order: KindGroup[] = ["animal", "fat", "plant", "other"];
  const splits = splitGroups(p.ingredients).slice(0, 2);
  const hasVague = p.ingredients.some((i) => !i.named && !UNNEEDED.has(i.kind) && kindGroup(i.kind) !== "other");
  const hasUnneeded = p.ingredients.some((i) => UNNEEDED.has(i.kind));

  return (
    <div>
      <div className="flex h-5 overflow-hidden rounded-none border border-ink bg-stone" role="img" aria-label={order.map((g) => `${t(`product.group.${g}`)} ${Math.round((totals[g] / sum) * 100)}%`).join(", ")}>
        {order.map((g) => (
          <div key={g} style={{ width: `${(totals[g] / sum) * 100}%`, background: GROUP_STYLE[g].bar }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs tabular-nums text-ink-soft">
        {order.map((g) => (
          <li key={g} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-none border border-ink/40" style={{ background: GROUP_STYLE[g].bar }} aria-hidden />
            {t(`product.group.${g}`)} ≈ {Math.round((totals[g] / sum) * 100)}%
          </li>
        ))}
      </ul>
      <p className="mt-1 font-mono text-[0.7rem] text-ink-faint">{t("product.estimateNote")}</p>

      <ol className="mt-5 flex flex-wrap gap-2">
        {p.ingredients.map((i, idx) => (
          <li
            key={`${i.raw}-${idx}`}
            title={UNNEEDED.has(i.kind) ? t("product.legendUnneeded") : !i.named && kindGroup(i.kind) !== "other" ? t("product.legendVague") : undefined}
            className={`rounded-sm border px-2.5 py-1 text-sm ${
              idx < 5 ? "font-medium" : ""
            } ${
              UNNEEDED.has(i.kind)
                ? "border-danger bg-danger-soft font-semibold text-danger"
                : `${GROUP_STYLE[kindGroup(i.kind)].chip}${!i.named && kindGroup(i.kind) !== "other" ? " border-dashed border-ink" : ""}`
            }`}
          >
            <span className="mr-1.5 font-mono text-[0.65rem] tabular-nums text-ink-faint">#{idx + 1}</span>
            {i.raw}
            {!i.named && !UNNEEDED.has(i.kind) && kindGroup(i.kind) !== "other" && <span className="ml-1 font-mono text-ink-faint" aria-hidden>?</span>}
            {i.pct !== undefined && <span className="ml-1.5 font-mono text-xs font-semibold tabular-nums text-ink">{i.pct}%</span>}
          </li>
        ))}
      </ol>
      {(hasVague || hasUnneeded) && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-ink-soft">
          {hasVague && (
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-none border border-dashed border-ink" aria-hidden />
              {t("product.legendVague")}
            </li>
          )}
          {hasUnneeded && (
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-none border border-danger bg-danger-soft" aria-hidden />
              {t("product.legendUnneeded")}
            </li>
          )}
        </ul>
      )}

      {splits.map((g) => (
        <p key={g.forms.join("|")} className="mt-4 flex gap-3 rounded-sm border border-warn bg-warn-soft p-4 text-sm text-ink">
          <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <span>
            <strong className="font-mono text-xs uppercase tracking-wider">{t("product.splitTitle")}</strong>{" "}
            {t(g.outweighsFirst ? "product.splitTextFirst" : "product.splitText", { count: g.forms.length, forms: g.forms.join(", "), pct: g.share, first: p.ingredients[0].raw })}
          </span>
        </p>
      ))}

      <details className="mt-5 rounded-sm border border-ink bg-cream p-4 text-sm">
        <summary className="cursor-pointer font-mono text-xs font-semibold uppercase tracking-wider text-ink">{t("product.originalText")}</summary>
        <p className="mt-2 border-t border-line pt-2 font-mono text-xs leading-relaxed text-ink-soft">{p.ingredientsText}</p>
        <p className="mt-2 text-xs text-ink-faint">{t("product.originalLanguageNote")}</p>
      </details>
    </div>
  );
}
