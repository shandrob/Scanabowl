import { IconCheck, IconAlert } from "@/components/ui/Icons";
import type { ProductDetail } from "@/lib/data/types";
import type { TFunction } from "@/lib/i18n/t";
import { FEDIAF_MIN } from "@/lib/scoring/nutrition";

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

export function AnalysisTable({ p, t }: { p: ProductDetail; t: TFunction }) {
  const n = p.nutrition;
  if (!n) return <p className="text-ink-soft">{t("product.noAnalysis")}</p>;
  const est = new Set(n.estimated);
  const ref = FEDIAF_MIN[p.species][p.lifeStage === "young" ? "young" : "adult"];
  const rows: Array<[string, number, number, boolean?]> = [
    [t("analysis.protein"), n.asFed.protein, n.dm.protein],
    [t("analysis.fat"), n.asFed.fat, n.dm.fat],
    [t("analysis.fibre"), n.asFed.fibre, n.dm.fibre, est.has("fibre")],
    [t("analysis.ash"), n.asFed.ash, n.dm.ash, est.has("ash")],
    [t("analysis.moisture"), n.asFed.moisture, 0, est.has("moisture")],
    [t("analysis.carbs"), n.asFed.nfe, n.dm.nfe, true],
  ];
  const proteinOk = n.proteinPer1000kcal >= ref.proteinPer1000 - 0.5;
  const fatOk = n.fatPer1000kcal >= ref.fatPer1000 - 0.5;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] text-left text-[0.95rem]">
          <thead>
            <tr className="border-b border-line font-mono text-[0.68rem] uppercase tracking-wider text-ink-faint">
              <th className="py-2 pr-4 font-semibold">{t("analysis.nutrient")}</th>
              <th className="py-2 pr-4 text-right font-semibold">{t("analysis.asFed")}</th>
              <th className="py-2 text-right font-semibold">{t("analysis.dryMatter")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, asFed, dm, estimated], i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-2 pr-4 text-ink">{label}{estimated ? <span className="text-ink-faint" title={t("analysis.estimated")}> *</span> : null}</td>
                <td className="py-2 pr-4 text-right font-mono">{f1(asFed)}%</td>
                <td className="py-2 text-right font-mono text-ink-soft">{label === t("analysis.moisture") ? "–" : `${f1(dm)}%`}</td>
              </tr>
            ))}
            {n.dm.calcium !== undefined && (
              <tr className="border-b border-line/60">
                <td className="py-2 pr-4 text-ink">{t("analysis.calcium")}</td>
                <td className="py-2 pr-4 text-right font-mono">{f1((n.dm.calcium * (100 - n.asFed.moisture)) / 100)}%</td>
                <td className="py-2 text-right font-mono text-ink-soft">{f1(n.dm.calcium)}%</td>
              </tr>
            )}
            {n.dm.phosphorus !== undefined && (
              <tr className="border-b border-line/60">
                <td className="py-2 pr-4 text-ink">{t("analysis.phosphorus")}</td>
                <td className="py-2 pr-4 text-right font-mono">{f1((n.dm.phosphorus * (100 - n.asFed.moisture)) / 100)}%</td>
                <td className="py-2 text-right font-mono text-ink-soft">{f1(n.dm.phosphorus)}%</td>
              </tr>
            )}
            <tr>
              <td className="py-2 pr-4 text-ink">{t("analysis.energy")}</td>
              <td className="py-2 pr-4 text-right font-mono" colSpan={2}>
                {Math.round(n.kcalPer100g)} kcal / 100 g <span className="text-xs text-ink-faint">({t(`analysis.kcal.${n.kcalSource}`)})</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {<p className="mt-2 text-xs text-ink-faint">* {t("analysis.estimatedNote")}</p>}

      <div className="mt-5 rounded-xl border border-line bg-cream/60 p-4 text-sm">
        <p className="font-semibold text-brand-deep">{t("analysis.fediafTitle")}</p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-start gap-2">
            {proteinOk ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" /> : <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-grade-e" />}
            <span>{t("analysis.proteinPer1000", { value: f1(n.proteinPer1000kcal), min: ref.proteinPer1000 })}</span>
          </li>
          <li className="flex items-start gap-2">
            {fatOk ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" /> : <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-grade-e" />}
            <span>{t("analysis.fatPer1000", { value: f1(n.fatPer1000kcal), min: ref.fatPer1000 })}</span>
          </li>
          <li className="text-ink-soft">{t("analysis.energyShare", { p: Math.round(n.energyShare.protein), f: Math.round(n.energyShare.fat), c: Math.round(n.energyShare.carbs) })}</li>
        </ul>
        <p className="mt-2 text-xs text-ink-faint">{t("analysis.fediafNote")}</p>
      </div>
    </div>
  );
}
