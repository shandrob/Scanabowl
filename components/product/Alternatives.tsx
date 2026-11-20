"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { gradeOf } from "@/components/ui/grade";
import { ProductImage } from "@/components/ui/ProductImage";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { IndexEntry } from "@/lib/data/types";
import { localePath } from "@/lib/i18n/config";
import { scoreAria } from "@/lib/labels";
import { packGrams } from "@/lib/pets/energy";
import { usePets } from "@/lib/pets/store";
import { personalFit } from "@/lib/scoring/personalize";
import type { Species } from "@/lib/scoring/types";

function pricePerKg(e: IndexEntry): number | null {
  if (!e.pc || e.pc <= 0) return null;
  const g = e.pk ? packGrams(e.pk) : null;
  if (!g || g <= 0) return null;
  return e.pc / (g / 1000);
}

/** Higher-scoring and better-value foods of the same kind - placed directly under the daily cost calculator. */
export function Alternatives({
  candidates,
  species,
  currentScore,
  currentId,
}: {
  candidates: IndexEntry[];
  species: Species;
  currentScore?: number | null;
  currentId?: string;
}) {
  const t = useT();
  const lang = useLang();
  const { active } = usePets();
  const pet = active && active.species === species ? active : null;
  const [tab, setTab] = useState<"score" | "value">("score");

  const { byScore, byValue } = useMemo(() => {
    const safe = candidates
      .map((e) => ({ e, fit: pet ? personalFit(e, pet) : null, ppk: pricePerKg(e) }))
      .filter((r) => !r.fit?.allergy.excluded && !r.fit?.disliked.length);

    const strictlyHigher = [...safe]
      .filter((r) => (currentScore == null ? true : (r.e.sc ?? 0) > currentScore))
      .sort((a, b) => (pet ? (b.fit?.score ?? 0) - (a.fit?.score ?? 0) : (b.e.sc ?? 0) - (a.e.sc ?? 0)));

    const scoreList =
      strictlyHigher.length >= 4
        ? strictlyHigher.slice(0, 4)
        : [
            ...strictlyHigher,
            ...[...safe]
              .filter((r) => !strictlyHigher.some((s) => s.e.i === r.e.i) && (r.e.sc ?? 0) >= 85)
              .sort((a, b) => (b.e.sc ?? 0) - (a.e.sc ?? 0)),
          ].slice(0, 4);

    const valueList = [...safe]
      .filter((r) => r.ppk !== null && (r.e.sc ?? 0) >= 75)
      .sort((a, b) => (a.ppk ?? 9999) - (b.ppk ?? 9999) || (b.e.sc ?? 0) - (a.e.sc ?? 0))
      .slice(0, 4);

    return { byScore: scoreList, byValue: valueList };
  }, [candidates, pet, currentScore]);

  const activeList = tab === "value" ? (byValue.length > 0 ? byValue : byScore) : byScore.length > 0 ? byScore : byValue;
  if (byScore.length === 0 && byValue.length === 0) return null;

  return (
    <section id="alternatives" aria-labelledby="alt-h" className="scroll-mt-24 rounded-2xl border border-line bg-paper p-5 shadow-card">
      <div>
        <h2 id="alt-h" className="font-display text-lg font-semibold tracking-tight text-brand-deep">
          {t("product.alternativesTitle")}
        </h2>
        <p className="mt-0.5 font-sans text-xs text-ink-soft">
          {pet ? t("product.alternativesPet", { name: pet.name }) : t("product.alternativesText")}
        </p>
      </div>

      {byScore.length > 0 && byValue.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-line bg-cream/70 p-1">
          <button
            type="button"
            onClick={() => setTab("score")}
            className={`rounded-lg px-2.5 py-1.5 font-sans text-xs font-semibold transition ${
              tab === "score" ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t("product.altTabScore")}
          </button>
          <button
            type="button"
            onClick={() => setTab("value")}
            className={`rounded-lg px-2.5 py-1.5 font-sans text-xs font-semibold transition ${
              tab === "value" ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t("product.altTabValue")}
          </button>
        </div>
      )}

      <ul className="mt-3.5 space-y-2.5">
        {activeList.map(({ e, fit, ppk }) => {
          const displayScore = fit?.score ?? e.sc;
          const grade = gradeOf(displayScore);
          const perKgStr = ppk !== null ? ppk.toFixed(2).replace(".", lang === "en" ? "." : ",") : null;
          return (
            <li key={e.i}>
              <Link
                href={localePath(lang, `/foods/${e.s}`)}
                prefetch={false}
                className="group flex items-center gap-3 rounded-xl border border-line bg-cream/50 p-3 transition hover:border-brand-mid/50 hover:bg-paper hover:shadow-sm"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-white p-1">
                  <ProductImage ean={e.img ?? e.e} hasImage={e.im === 1} alt="" size={48} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[11px] font-semibold text-brand">{e.b}</p>
                  <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-ink group-hover:text-brand-deep">
                    {e.n}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 font-sans text-[11px] text-ink-soft">
                    {perKgStr && (
                      <span className="rounded bg-paper px-1.5 py-0.5 font-semibold tabular-nums border border-line">
                        {t("order.perKg", { price: perKgStr })}
                      </span>
                    )}
                    {e.gf === 1 && (
                      <span className="rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand-deep">
                        {t("common.grainFree")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <ScoreRing score={displayScore} grade={grade} size={46} label={scoreAria(t, displayScore, grade)} />
                </div>
              </Link>
              {currentId && (
                <div className="mt-1 flex justify-end px-1">
                  <Link
                    href={`${localePath(lang, "/compare")}?species=${species}&f=${encodeURIComponent(currentId)},${encodeURIComponent(e.i)}`}
                    prefetch={false}
                    className="font-sans text-[11px] font-semibold text-brand hover:underline"
                  >
                    {t("product.compareAlt")} →
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
