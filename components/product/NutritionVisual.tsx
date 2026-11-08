import type { BenchKey, Benchmark } from "@/lib/data/products";
import type { ProductDetail } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { foodTypeLabel, speciesLabel } from "@/lib/labels";

const COLORS = { protein: "#2D6A4F", fat: "#B45309", carbs: "#6B6A65" } as const;

const num = (v: number, lang: Locale) => v.toLocaleString(lang, { maximumFractionDigits: 0 });

/**
 * Where the energy comes from, and how protein, fat and carbohydrates compare with foods of the same kind.
 * Plain server-rendered HTML/CSS: no chart library, nothing extra to download.
 */
export function NutritionVisual({ p, bench, lang, t }: { p: ProductDetail; bench: { count: number; values: Record<BenchKey, Benchmark> } | null; lang: Locale; t: TFunction }) {
  const n = p.nutrition;
  if (!n) return null;
  const share = n.energyShare;
  const total = share.protein + share.fat + share.carbs || 1;
  const parts: Array<[BenchKey, number]> = [
    ["protein", (share.protein / total) * 100],
    ["fat", (share.fat / total) * 100],
    ["carbs", (share.carbs / total) * 100],
  ];
  const label = { protein: t("analysis.energyProtein"), fat: t("analysis.energyFat"), carbs: t("analysis.energyCarbs") };

  const rows: Array<[BenchKey, string, number, string]> = [
    ["protein", t("analysis.protein"), n.dm.protein, t("analysis.unitDm")],
    ["fat", t("analysis.fat"), n.dm.fat, t("analysis.unitDm")],
    ["carbs", t("analysis.carbs"), share.carbs, t("analysis.unitEnergy")],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">{t("analysis.energyTitle")}</h3>
        <div className="mt-2 flex h-5 overflow-hidden rounded-none border border-ink bg-stone" role="img" aria-label={parts.map(([k, v]) => `${label[k]} ${Math.round(v)}%`).join(", ")}>
          {parts.map(([k, v]) => (
            <div key={k} style={{ width: `${v}%`, background: COLORS[k] }} />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs tabular-nums text-ink-soft">
          {parts.map(([k, v]) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-none border border-ink/40" style={{ background: COLORS[k] }} aria-hidden />
              {label[k]} {Math.round(v)}%
            </li>
          ))}
        </ul>
      </div>

      {bench && (
        <div className="rounded-sm border border-line bg-cream p-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
            {t("analysis.benchTitle", { count: bench.count.toLocaleString(lang), type: foodTypeLabel(t, p.foodType), species: speciesLabel(t, p.species, true) })}
          </h3>
          <ul className="mt-3 space-y-4">
            {rows.map(([k, name, value, unit]) => {
              const b = bench.values[k];
              const max = Math.max(value, b.p90) * 1.15 || 1;
              const pos = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
              return (
                <li key={k}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="text-ink">
                      {name} <span className="font-mono font-semibold tabular-nums">{num(value, lang)}%</span> <span className="font-mono text-xs text-ink-faint">{unit}</span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-ink-soft">{b.below >= 50 ? t("analysis.benchHigher", { pct: b.below }) : t("analysis.benchLower", { pct: 100 - b.below })}</span>
                  </div>
                  <div className="relative mt-1.5 h-3 rounded-none border border-line bg-paper" role="img" aria-label={t("analysis.benchAria", { value: num(value, lang), median: num(b.median, lang), low: num(b.p10, lang), high: num(b.p90, lang) })}>
                    <div className="absolute inset-y-0 opacity-25" style={{ left: pos(b.p10), width: `calc(${pos(b.p90)} - ${pos(b.p10)})`, background: COLORS[k] }} />
                    <div className="absolute inset-y-[-3px] w-0.5 bg-ink" style={{ left: pos(b.median) }} />
                    <div className="absolute top-1/2 h-4 w-3 -translate-x-1/2 -translate-y-1/2 rounded-none border border-ink" style={{ left: pos(value), background: COLORS[k] }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">{t("analysis.benchNote")}</p>
        </div>
      )}
    </div>
  );
}
