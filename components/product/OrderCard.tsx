"use client";

import { useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { dailyEnergy, gramsPerDay, packGrams } from "@/lib/pets/energy";
import { usePets } from "@/lib/pets/store";
import type { PetProfile, Species } from "@/lib/scoring/types";

type Activity = PetProfile["activity"];

function buildCalcPet(species: Species, weightKg: number, activity: Activity): PetProfile {
  return {
    id: "calc",
    name: "",
    species,
    ageYears: 4,
    weightKg,
    neutered: species === "cat",
    activity,
    bodyCondition: "ideal",
    dogSize: weightKg < 10 ? "small" : weightKg < 25 ? "medium" : weightKg < 45 ? "large" : "giant",
    allergens: [],
    customAllergens: [],
    strictAllergies: true,
  };
}

/**
 * Reference price card + interactive daily portion, cost & 7-day transition calculator on product detail pages.
 */
export function OrderCard({
  pack,
  price,
  species = "dog",
  kcalPer100g = null,
}: {
  pack?: string;
  price?: number;
  species?: Species;
  kcalPer100g?: number | null;
}) {
  const t = useT();
  const lang = useLang();
  const { active } = usePets();
  const matchedPet = active && active.species === species ? active : null;

  const defaultWeight = matchedPet ? matchedPet.weightKg : species === "dog" ? 15 : 4;
  const [weightInput, setWeightInput] = useState<string>(String(defaultWeight));
  const [activity, setActivity] = useState<Activity>(matchedPet?.activity ?? "moderate");
  const [customPrice, setCustomPrice] = useState<string>(price && price > 0 ? price.toFixed(2) : "");

  const parsedWeight = Number.parseFloat(weightInput.replace(",", "."));
  const weightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : defaultWeight;

  const parsedPrice = Number.parseFloat(customPrice.replace(",", "."));
  const effectivePrice =
    Number.isFinite(parsedPrice) && parsedPrice > 0
      ? parsedPrice
      : price !== undefined && price > 0
        ? price
        : null;

  const gramsInPack = pack ? packGrams(pack) : null;
  const perKg =
    effectivePrice && gramsInPack && gramsInPack > 0
      ? (effectivePrice / (gramsInPack / 1000)).toFixed(2)
      : null;

  const energy = dailyEnergy(buildCalcPet(species, weightKg, activity));
  const dailyGrams = kcalPer100g && kcalPer100g > 0 ? gramsPerDay(energy.kcal, kcalPer100g) : null;
  const daysPerPack =
    dailyGrams && gramsInPack && gramsInPack > 0 ? Math.max(1, Math.round(gramsInPack / dailyGrams)) : null;
  const costPerDay =
    effectivePrice && gramsInPack && dailyGrams ? (effectivePrice / gramsInPack) * dailyGrams : null;
  const costPerMonth = costPerDay !== null ? costPerDay * 30 : null;

  const fmtMoney = (v: number) => v.toFixed(2).replace(".", lang === "en" ? "." : ",");

  if (effectivePrice === null && !dailyGrams) return null;

  return (
    <section aria-labelledby="order-h" className="rounded-2xl border border-line bg-paper p-5 shadow-card">
      {price !== undefined && price > 0 && (
        <div className="mb-4 border-b border-line pb-4">
          <h2 id="order-h" className="font-sans text-xs font-semibold text-ink-soft">
            {t("order.priceLabel")}{pack ? ` · ${pack}` : ""}
          </h2>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-semibold tabular-nums text-ink">€{fmtMoney(price)}</span>
            {perKg && (
              <span className="rounded-full bg-cream px-2.5 py-1 font-sans text-xs font-semibold tabular-nums text-ink-soft">
                {t("order.perKg", { price: perKg })}
              </span>
            )}
          </div>
        </div>
      )}

      {dailyGrams !== null && (
        <div>
          <h3 id={price && price > 0 ? undefined : "order-h"} className="font-display text-lg font-semibold text-brand-deep">
            {t("order.calcTitle")}
          </h3>
          <p className="mt-0.5 font-sans text-xs text-ink-soft">{t("order.calcSubtitle")}</p>

          {/* Weight & Activity Controls */}
          <div className="mt-3.5 space-y-3 rounded-xl border border-line bg-cream/70 p-3.5">
            <div>
              <div className="flex items-center justify-between font-sans text-xs">
                <label htmlFor="calc-weight" className="font-medium text-ink">
                  {t("compare.weight")}
                </label>
                <span className="font-bold tabular-nums text-brand-deep">{weightKg} kg</span>
              </div>
              <input
                id="calc-weight"
                type="range"
                min={species === "cat" ? 1 : 2}
                max={species === "cat" ? 12 : 65}
                step={species === "cat" ? 0.5 : 1}
                value={Math.min(species === "cat" ? 12 : 65, Math.max(species === "cat" ? 1 : 2, weightKg))}
                onChange={(e) => setWeightInput(e.target.value)}
                className="mt-1.5 w-full accent-brand"
              />
            </div>

            <div>
              <span className="block font-sans text-xs font-medium text-ink">{t("pet.activity")}</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(["low", "moderate", "high"] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivity(act)}
                    className={`rounded-lg px-2 py-1.5 font-sans text-xs font-semibold transition ${
                      activity === act
                        ? "bg-brand text-white shadow-sm"
                        : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                    }`}
                  >
                    {t(act === "low" ? "pet.activityLow" : act === "moderate" ? "pet.activityMod" : "pet.activityHigh")}
                  </button>
                ))}
              </div>
            </div>

            {gramsInPack && (
              <div>
                <label htmlFor="calc-price" className="block font-sans text-xs font-medium text-ink">
                  {t("compare.price")} ({pack})
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs text-ink-faint">€</span>
                  <input
                    id="calc-price"
                    type="text"
                    inputMode="decimal"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0,00"
                    className="h-9 w-full rounded-lg border border-[#D6D1C7] bg-paper pl-7 pr-3 font-sans text-xs tabular-nums text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-line bg-cream p-3">
              <p className="font-sans text-[11px] font-medium text-ink-soft">{t("personal.portionStatLabel")}</p>
              <p className="mt-0.5 font-sans text-base font-bold tabular-nums text-brand-deep">
                {t("personal.gramsPerDayUnit", { grams: dailyGrams })}
              </p>
              <p className="font-sans text-[11px] tabular-nums text-ink-faint">~{energy.kcal} kcal</p>
            </div>

            {costPerDay !== null ? (
              <div className="rounded-xl border border-brand/25 bg-brand-soft/60 p-3">
                <p className="font-sans text-[11px] font-medium text-brand-deep">{t("personal.costStatLabel")}</p>
                <p className="mt-0.5 font-sans text-base font-bold tabular-nums text-brand-deep">
                  {t("personal.euroPerDayUnit", { cost: fmtMoney(costPerDay) })}
                </p>
                {costPerMonth !== null && (
                  <p className="font-sans text-[11px] tabular-nums text-ink-soft">
                    {t("order.perMonth", { cost: fmtMoney(costPerMonth) })}
                  </p>
                )}
              </div>
            ) : daysPerPack !== null ? (
              <div className="rounded-xl border border-line bg-cream p-3">
                <p className="font-sans text-[11px] font-medium text-ink-soft">{t("order.packLastsLabel")}</p>
                <p className="mt-0.5 font-sans text-base font-bold tabular-nums text-brand-deep">
                  {t("order.packLastsDays", { days: daysPerPack })}
                </p>
                {pack && <p className="font-sans text-[11px] text-ink-faint">{pack}</p>}
              </div>
            ) : null}
          </div>

          {daysPerPack !== null && costPerDay !== null && (
            <p className="mt-2 font-sans text-xs tabular-nums text-ink-soft">
              {t("order.packLastsSummary", { pack: pack ?? "", days: daysPerPack })}
            </p>
          )}

          {/* 7-Day Transition Schedule */}
          <details className="group mt-3.5 rounded-xl border border-line bg-cream/60 p-3 font-sans text-xs">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-brand-deep">
              <span>{t("order.transitionTitle")}</span>
              <span aria-hidden className="text-sm text-brand transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">{t("order.transitionIntro")}</p>
            <ul className="mt-2.5 space-y-1.5 tabular-nums">
              {([
                ["1–2", 0.25],
                ["3–4", 0.5],
                ["5–6", 0.75],
                ["7+", 1],
              ] as const).map(([days, share]) => {
                const newG = Math.round(dailyGrams * share);
                const oldPct = Math.round((1 - share) * 100);
                const newPct = Math.round(share * 100);
                return (
                  <li key={days} className="flex items-center justify-between rounded-lg bg-paper px-2.5 py-1.5 border border-line">
                    <span className="font-semibold text-ink">{t("order.transitionDays", { days })}</span>
                    <span className="text-ink-soft">
                      <strong className="text-brand-deep">{newG} g</strong> ({newPct}% {t("order.transitionNew")}
                      {oldPct > 0 ? ` · ${oldPct}% ${t("order.transitionOld")}` : ""})
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
