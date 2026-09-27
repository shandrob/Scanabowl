import type { BenchKey, Benchmark } from "@/lib/data/products";
import type { ProductDetail } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { foodTypeLabel, speciesLabel } from "@/lib/labels";

const COLORS = { protein: "#15803d", fat: "#d97706", carbs: "#64748b" } as const;

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
        <h3 className="text-sm font-semibold text-ink">{t("analysis.energyTitle")}</h3>
        <div className="mt-2 flex h-5 overflow-hidden rounded-full bg-line/60" role="img" aria-label={parts.map(([k, v]) => `${label[k]} ${Math.round(v)}%`).join(", ")}>
          {parts.map(([k, v]) => (
            <div key={k} style={{ width: `${v}%`, background: COLORS[k] }} />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
          {parts.map(([k, v]) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[k] }} aria-hidden />
              {label[k]} {Math.round(v)}%
            </li>
          ))}
        </ul>
      </div>

      {bench && (
        <div>
          <h3 className="text-sm font-semibold text-ink">
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
                      {name} <span className="font-mono font-semibold">{num(value, lang)}%</span> <span className="text-xs text-ink-faint">{unit}</span>
                    </span>
                    <span className="text-xs text-ink-soft">{b.below >= 50 ? t("analysis.benchHigher", { pct: b.below }) : t("analysis.benchLower", { pct: 100 - b.below })}</span>
                  </div>
                  <div className="relative mt-1.5 h-3 rounded-full bg-line/50" role="img" aria-label={t("analysis.benchAria", { value: num(value, lang), median: num(b.median, lang), low: num(b.p10, lang), high: num(b.p90, lang) })}>
                    <div className="absolute inset-y-0 rounded-full opacity-25" style={{ left: pos(b.p10), width: `calc(${pos(b.p90)} - ${pos(b.p10)})`, background: COLORS[k] }} />
                    <div className="absolute inset-y-[-3px] w-0.5 bg-ink-faint" style={{ left: pos(b.median) }} />
                    <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: pos(value), background: COLORS[k] }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">{t("analysis.benchNote")}</p>
        </div>
      )}
    </div>
  );
}
