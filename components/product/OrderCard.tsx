"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconExternal } from "@/components/ui/Icons";
import { localePath } from "@/lib/i18n/config";
import { dailyEnergy, gramsPerDay, packGrams } from "@/lib/pets/energy";
import { usePets } from "@/lib/pets/store";
import type { FoodType, PetProfile, Species } from "@/lib/scoring/types";
import { shopLinks } from "@/lib/shops";

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
 * Reference price card + interactive daily portion, cost, 7-day transition & multi-shop price comparison card.
 */
export function OrderCard({
  ean = "",
  name = "",
  brand = "",
  pack,
  price,
  bolUrl,
  zooplusUrl,
  species = "dog",
  foodType = "dry",
  kcalPer100g = null,
}: {
  ean?: string;
  name?: string;
  brand?: string;
  pack?: string;
  price?: number;
  bolUrl?: string;
  zooplusUrl?: string;
  species?: Species;
  foodType?: FoodType;
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
  const [wetGrams, setWetGrams] = useState<number>(
    foodType !== "wet" && matchedPet?.wetGramsPerDay ? matchedPet.wetGramsPerDay : 0,
  );

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
  const typicalWetKcalPer100g = species === "cat" ? 85 : 95;
  const typicalDryKcalPer100g = species === "cat" ? 385 : 365;

  let dailyGrams: number | null = null;
  let mainKcal = energy.kcal;
  let companionGrams = 0;
  let companionKcal = 0;

  if (kcalPer100g && kcalPer100g > 0) {
    if (foodType === "wet" && wetGrams > 0) {
      dailyGrams = wetGrams;
      mainKcal = Math.min(energy.kcal, Math.round((wetGrams * kcalPer100g) / 100));
      companionKcal = Math.max(0, energy.kcal - mainKcal);
      companionGrams = companionKcal > 0 ? gramsPerDay(companionKcal, typicalDryKcalPer100g) : 0;
    } else if (foodType !== "wet" && wetGrams > 0) {
      companionGrams = wetGrams;
      companionKcal = Math.min(Math.round(energy.kcal * 0.85), Math.round((wetGrams * typicalWetKcalPer100g) / 100));
      mainKcal = Math.max(0, energy.kcal - companionKcal);
      dailyGrams = gramsPerDay(mainKcal, kcalPer100g);
    } else {
      dailyGrams = gramsPerDay(energy.kcal, kcalPer100g);
    }
  }

  const wetPresets = species === "cat" ? [0, 85, 100, 170] : [0, 100, 200, 400];
  const daysPerPack =
    dailyGrams && dailyGrams > 0 && gramsInPack && gramsInPack > 0 ? Math.max(1, Math.round(gramsInPack / dailyGrams)) : null;
  const costPerDay =
    effectivePrice && gramsInPack && dailyGrams !== null ? (effectivePrice / gramsInPack) * dailyGrams : null;
  const costPerMonth = costPerDay !== null ? costPerDay * 30 : null;

  const fmtMoney = (v: number) => v.toFixed(2).replace(".", lang === "en" ? "." : ",");
  const shops =
    name || ean
      ? shopLinks({ ean, name, brand, bolUrl, zooplusUrl }, lang, `scanabowl-${lang}-${ean || "product"}`)
      : [];

  if (effectivePrice === null && !dailyGrams && shops.length === 0) return null;

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

            <div>
              <span className="block font-sans text-xs font-medium text-ink">
                {t(foodType === "wet" ? "order.mixedWetLabel" : "order.mixedDryLabel")}
              </span>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {wetPresets.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setWetGrams(g)}
                    className={`rounded-lg px-2 py-1.5 font-sans text-xs font-semibold tabular-nums transition ${
                      wetGrams === g
                        ? "bg-brand text-white shadow-sm"
                        : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                    }`}
                  >
                    {g === 0 ? t("order.mixedOff") : `${g} g`}
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
          {wetGrams > 0 && (
            <div className="mt-3 rounded-xl border border-brand/25 bg-brand-soft/60 px-3 py-2 font-sans text-xs leading-snug text-brand-deep">
              {foodType === "wet"
                ? t("order.mixedSummaryWet", { wetGrams: dailyGrams, dryGrams: companionGrams, dryKcal: companionKcal })
                : t("order.mixedSummaryDry", { dryGrams: dailyGrams, wetGrams: companionGrams, wetKcal: companionKcal })}
            </div>
          )}

          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-line bg-cream p-3">
              <p className="font-sans text-[11px] font-medium text-ink-soft">{t("personal.portionStatLabel")}</p>
              <p className="mt-0.5 font-sans text-base font-bold tabular-nums text-brand-deep">
                {t("personal.gramsPerDayUnit", { grams: dailyGrams })}
              </p>
              <p className="font-sans text-[11px] tabular-nums text-ink-faint">~{mainKcal} kcal</p>
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

      {shops.length > 0 && (
        <div className={dailyGrams !== null || (price !== undefined && price > 0) ? "mt-5 border-t border-line pt-4" : ""}>
          <h3 id={price && price > 0 ? undefined : dailyGrams !== null ? undefined : "order-h"} className="font-display text-base font-semibold text-brand-deep">
            {t("order.comparePricesTitle")}
          </h3>
          <p className="mt-0.5 font-sans text-xs text-ink-soft">{t("order.comparePricesText")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {shops.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-sans text-xs font-semibold transition ${
                  s.id === "zooplus"
                    ? "bg-brand text-white hover:bg-brand-deep"
                    : "border border-line bg-cream text-ink hover:border-brand hover:bg-paper hover:text-brand-deep"
                }`}
              >
                <span className="truncate">
                  {s.id === "zooplus" && s.exact && price !== undefined && price > 0
                    ? `${s.label} · €${fmtMoney(price)}`
                    : s.label}
                </span>
                <IconExternal className="h-3.5 w-3.5 shrink-0" />
              </a>
            ))}
          </div>
          <p className="mt-2.5 font-sans text-[11px] leading-relaxed text-ink-faint">
            {t("order.disclosure")}{" "}
            <Link href={localePath(lang, "/affiliate")} className="underline hover:text-ink">
              {t("order.moreInfo")}
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
