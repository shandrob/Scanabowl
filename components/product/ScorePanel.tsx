import Link from "next/link";
import { GRADE_STYLE } from "@/components/ui/grade";
import { IconAlert, IconCheck, IconInfo, IconX } from "@/components/ui/Icons";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { ProductDetail } from "@/lib/data/types";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { gradeLabel, scoreAria } from "@/lib/labels";
import type { Reason } from "@/lib/scoring/types";

function reasonText(t: TFunction, r: Reason, prefix = "reasons"): string {
  const params = { ...(r.params ?? {}) };
  // ingredient names / lists come from the label and are shown as printed
  return t(`${prefix}.${r.code}`, params);
}

function Bar({ label, points, max, color }: { label: string; points: number; max: number; color: string }) {
  const pct = Math.round((points / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-ink-soft">
          {points.toFixed(1).replace(/\.0$/, "")}
          <span className="text-ink-faint"> / {max}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line/70" role="presentation">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function ScorePanel({ p, t, lang }: { p: ProductDetail; t: TFunction; lang: Locale }) {
  if (p.score === null || !p.grade || !p.pillars) {
    return (
      <section aria-labelledby="score-h" className="rounded-2xl border border-line bg-paper p-6 shadow-card">
        <h2 id="score-h" className="font-display text-xl font-semibold text-brand-deep">{t("product.noScoreTitle")}</h2>
        <p className="mt-2 flex gap-3 text-ink-soft">
          <IconInfo className="mt-1 h-5 w-5 shrink-0 text-brand-mid" />
          <span>{t(`product.notScored.${p.notScored ?? "no_ingredients"}`)}</span>
        </p>
      </section>
    );
  }
  const g = GRADE_STYLE[p.grade];
  const hazards = p.flags.filter((f) => f.severity === "hazard");
  const concerns = p.flags.filter((f) => f.severity === "concern");
  return (
    <section aria-labelledby="score-h" className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={p.score} grade={p.grade} size={132} animate label={scoreAria(t, p.score, p.grade)} />
        <div className="min-w-0 flex-1">
          <h2 id="score-h" className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-faint">{t("product.scoreTitle")}</h2>
          <p className={`mt-1 font-display text-3xl font-semibold ${g.text}`}>{gradeLabel(t, p.grade)}</p>
          <p className="mt-1 text-sm text-ink-soft">{t(`grade.desc.${p.grade}`)}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-faint">
            <IconInfo className="h-3.5 w-3.5" />
            {t(`confidence.${p.confidence}`)} ·{" "}
            <Link href={localePath(lang, "/how-we-score")} className="underline underline-offset-2 hover:text-brand">{t("product.howCalculated")}</Link>
          </p>
        </div>
      </div>

      {hazards.length > 0 && (
        <div className="mt-6 flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-danger" role="alert">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{t("product.hazardTitle")}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink">{hazards.map((f) => <li key={f.code}>{t(`flags.${f.code}`)}</li>)}</ul>
          </div>
        </div>
      )}
      {concerns.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-warn">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <ul className="list-disc pl-5 text-sm text-ink">{concerns.map((f) => <li key={f.code}>{t(`flags.${f.code}`)}</li>)}</ul>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Bar label={t("score.pillars.nutrition")} points={p.pillars.nutrition.points} max={p.pillars.nutrition.max} color="#0b7a57" />
        <Bar label={t("score.pillars.ingredients")} points={p.pillars.ingredients.points} max={p.pillars.ingredients.max} color="#065f46" />
        <Bar label={t("score.pillars.formulation")} points={p.pillars.formulation.points} max={p.pillars.formulation.max} color="#4d7c0f" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-brand-deep">{t("product.goodTitle")}</h3>
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
          <h3 className="font-display text-lg font-semibold text-brand-deep">{t("product.badTitle")}</h3>
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
