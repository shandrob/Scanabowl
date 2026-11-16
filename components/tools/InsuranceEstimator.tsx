"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { speciesLabel } from "@/lib/labels";
import type { Species } from "@/lib/scoring/types";

type AgeBand = "young" | "adult" | "senior";

const ESTIMATES: Record<Species, Record<AgeBand, { minPrem: number; maxPrem: number; buffer: number }>> = {
  dog: {
    young: { minPrem: 24, maxPrem: 42, buffer: 35 },
    adult: { minPrem: 30, maxPrem: 52, buffer: 45 },
    senior: { minPrem: 45, maxPrem: 75, buffer: 65 },
  },
  cat: {
    young: { minPrem: 14, maxPrem: 24, buffer: 22 },
    adult: { minPrem: 18, maxPrem: 30, buffer: 28 },
    senior: { minPrem: 26, maxPrem: 45, buffer: 40 },
  },
};

export function InsuranceEstimator() {
  const t = useT();
  const [species, setSpecies] = useState<Species>("dog");
  const [age, setAge] = useState<AgeBand>("young");

  const est = ESTIMATES[species][age];
  const fiveYearMin = est.minPrem * 12 * 5;
  const fiveYearMax = est.maxPrem * 12 * 5;
  const fiveYearBuffer = est.buffer * 12 * 5;

  return (
    <section
      aria-labelledby="ins-calc-h"
      className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8"
    >
      <h2 id="ins-calc-h" className="font-display text-2xl font-semibold tracking-tight text-brand-deep">
        {t("insurance.calcTitle")}
      </h2>
      <p className="mt-1.5 font-sans text-sm text-ink-soft">{t("insurance.calcSubtitle")}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-cream/70 p-4">
          <span className="block font-sans text-xs font-semibold text-ink">{t("pet.species")}</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["dog", "cat"] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSpecies(sp)}
                className={`rounded-lg px-3 py-2 font-sans text-sm font-semibold transition ${
                  species === sp
                    ? "bg-brand text-white shadow-sm"
                    : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                }`}
              >
                {speciesLabel(t, sp)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-cream/70 p-4">
          <span className="block font-sans text-xs font-semibold text-ink">{t("insurance.ageLabel")}</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["young", "adult", "senior"] as const).map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setAge(band)}
                className={`rounded-lg px-2.5 py-2 font-sans text-xs font-semibold transition ${
                  age === band
                    ? "bg-brand text-white shadow-sm"
                    : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                }`}
              >
                {t(`insurance.age.${band}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-brand/25 bg-brand-soft/50 p-5">
          <p className="font-sans text-xs font-semibold text-brand-deep">{t("insurance.optionInsure")}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-brand-deep">
            €{est.minPrem}–€{est.maxPrem} <span className="font-sans text-sm font-normal text-ink-soft">{t("insurance.perMonth")}</span>
          </p>
          <p className="mt-1 font-sans text-xs tabular-nums text-ink-soft">
            {t("insurance.fiveYearCost", { min: fiveYearMin.toLocaleString(), max: fiveYearMax.toLocaleString() })}
          </p>
          <p className="mt-2.5 font-sans text-xs leading-relaxed text-ink-soft">{t("insurance.insureNote")}</p>
        </div>

        <div className="rounded-xl border border-line bg-cream/70 p-5">
          <p className="font-sans text-xs font-semibold text-ink">{t("insurance.optionBuffer")}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
            €{est.buffer} <span className="font-sans text-sm font-normal text-ink-soft">{t("insurance.perMonth")}</span>
          </p>
          <p className="mt-1 font-sans text-xs tabular-nums text-ink-soft">
            {t("insurance.fiveYearBuffer", { total: fiveYearBuffer.toLocaleString() })}
          </p>
          <p className="mt-2.5 font-sans text-xs leading-relaxed text-ink-soft">{t("insurance.bufferNote")}</p>
        </div>
      </div>
    </section>
  );
}
