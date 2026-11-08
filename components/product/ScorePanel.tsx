import Link from "next/link";
import { GRADE_STYLE } from "@/components/ui/grade";
import { IconAlert, IconCheck, IconInfo, IconX } from "@/components/ui/Icons";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { ProductDetail } from "@/lib/data/types";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { foodTypeLabel, gradeLabel, scoreAria, speciesLabel } from "@/lib/labels";
import type { Reason } from "@/lib/scoring/types";

function reasonText(t: TFunction, r: Reason, prefix = "reasons"): string {
  const params = { ...(r.params ?? {}) };
  // ingredient names / lists come from the label and are shown as printed
  return t(`${prefix}.${r.code}`, params);
}

function Bar({ label, points, max, color }: { label: string; points: number; max: number; color: string }) {
  const pct = Math.round((points / max) * 100);
  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-wider">
        <span className="font-semibold text-ink">{label}</span>
        <span className="tabular-nums text-ink-soft">
          <strong className="text-ink">{points.toFixed(1).replace(/\.0$/, "")}</strong>
          <span className="text-ink-faint"> / {max}</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-none border border-ink/40 bg-stone" role="presentation">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function ScorePanel({ p, t, lang, rank }: { p: ProductDetail; t: TFunction; lang: Locale; rank?: { rank: number; total: number } | null }) {
  if (p.score === null || !p.grade || !p.pillars) {
    return (
      <section aria-labelledby="score-h" className="rounded-sm border-2 border-ink bg-paper p-6">
        <h2 id="score-h" className="font-display text-xl font-semibold text-ink">{t("product.noScoreTitle")}</h2>
        <p className="mt-2 flex gap-3 text-ink-soft">
          <IconInfo className="mt-1 h-5 w-5 shrink-0 text-brand" />
          <span>{t(`product.notScored.${p.notScored ?? "no_ingredients"}`)}</span>
        </p>
      </section>
    );
  }
  const g = GRADE_STYLE[p.grade];
  const hazards = p.flags.filter((f) => f.severity === "hazard");
  const concerns = p.flags.filter((f) => f.severity === "concern");
  // advice that does not change the score (e.g. "give a dry-fed cat enough to drink")
  const tips = p.flags.filter((f) => f.severity === "info" && f.code !== "values_estimated");
  return (
    <section aria-labelledby="score-h" className="rounded-sm border-2 border-ink bg-paper p-6 sm:p-8">
      <div className="flex flex-col gap-6 border-b-[6px] border-ink pb-6 sm:flex-row sm:items-center">
        <ScoreRing score={p.score} grade={p.grade} size={128} animate label={scoreAria(t, p.score, p.grade)} />
        <div className="min-w-0 flex-1">
          <h2 id="score-h" className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">{t("product.scoreTitle")}</h2>
          <p className={`mt-1 font-display text-3xl font-semibold tracking-tight ${g.text}`}>{gradeLabel(t, p.grade)}</p>
          <p className="mt-1 text-sm text-ink-soft">{t(`grade.desc.${p.grade}`)}</p>
          {rank && (
            // dry food is ranked among dry food, wet among wet: the list a buyer actually chooses from
            <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-brand-deep">
              <Link href={`${localePath(lang, "/foods")}?species=${p.species}&type=${p.foodType}`} prefetch={false} className="hover:underline">
                {t("product.rankInType", { rank: rank.rank, total: rank.total.toLocaleString(lang), type: foodTypeLabel(t, p.foodType), species: speciesLabel(t, p.species, true) })}
              </Link>
            </p>
          )}
          <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-ink-faint">
            <IconInfo className="h-3.5 w-3.5" />
            {t(`confidence.${p.confidence}`)} ·{" "}
            <Link href={localePath(lang, "/how-we-score")} className="underline underline-offset-2 hover:text-ink">{t("product.howCalculated")}</Link>
          </p>
        </div>
      </div>

      {hazards.length > 0 && (
        <div className="mt-6 flex gap-3 rounded-sm border-2 border-danger bg-danger-soft p-4 text-danger" role="alert">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider">{t("product.hazardTitle")}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink">{hazards.map((f) => <li key={f.code}>{t(`flags.${f.code}`)}</li>)}</ul>
          </div>
        </div>
      )}
      {concerns.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-sm border border-warn bg-warn-soft p-4 text-warn">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <ul className="list-disc pl-5 text-sm text-ink">{concerns.map((f) => <li key={f.code}>{t(`flags.${f.code}`)}</li>)}</ul>
        </div>
      )}

      {tips.map((f) => (
        <p key={f.code} className="mt-4 flex gap-3 rounded-sm border border-ink bg-stone p-4 text-sm text-ink">
          <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <span>{t(`flags.${f.code}`)}</span>
        </p>
      ))}

      {/* Three Pillar Breakdown Matrix */}
      <div className="mt-6 grid divide-y divide-line rounded-sm border border-ink bg-cream sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Bar label={t("score.pillars.nutrition")} points={p.pillars.nutrition.points} max={p.pillars.nutrition.max} color="#2D6A4F" />
        <Bar label={t("score.pillars.ingredients")} points={p.pillars.ingredients.points} max={p.pillars.ingredients.max} color="#1F4E3D" />
        <Bar label={t("score.pillars.formulation")} points={p.pillars.formulation.points} max={p.pillars.formulation.max} color="#3F6212" />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 border-t border-line pt-6 md:grid-cols-2">
        <div>
          <h3 className="border-b border-line pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-grade-a">{t("product.goodTitle")}</h3>
          {p.positives.length ? (
            <ul className="mt-3 space-y-2.5">
              {p.positives.map((r) => (
                <li key={r.code} className="flex gap-2.5 text-[0.95rem] leading-snug">
                  <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-grade-a" />
                  <span>{reasonText(t, r)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-faint">{t("product.nothingGood")}</p>
          )}
        </div>
        <div>
          <h3 className="border-b border-line pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-grade-e">{t("product.badTitle")}</h3>
          {p.negatives.length ? (
            <ul className="mt-3 space-y-2.5">
              {p.negatives.map((r) => (
                <li key={r.code} className="flex gap-2.5 text-[0.95rem] leading-snug">
                  <IconX className="mt-0.5 h-5 w-5 shrink-0 text-grade-e" />
                  <span>{reasonText(t, r)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-faint">{t("product.nothingBad")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
