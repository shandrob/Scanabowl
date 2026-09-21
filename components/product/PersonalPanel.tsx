"use client";

import Link from "next/link";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { GRADE_STYLE, gradeOf } from "@/components/ui/grade";
import { IconAlert, IconCheck, IconPaw, IconX } from "@/components/ui/Icons";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { IndexEntry } from "@/lib/data/types";
import { localePath } from "@/lib/i18n/config";
import { scoreAria, speciesLabel } from "@/lib/labels";
import { dailyEnergy, gramsPerDay, packGrams } from "@/lib/pets/energy";
import { usePets } from "@/lib/pets/store";
import { personalFit } from "@/lib/scoring/personalize";
import type { Species } from "@/lib/scoring/types";

/** Everything specific to the visitor's own pet: allergies, fit, portion size and cost. */
export function PersonalPanel({ entry, species, ingredientsText, price }: { entry: IndexEntry; species: Species; ingredientsText: string; price?: number }) {
  const t = useT();
  const lang = useLang();
  const { active } = usePets();

  if (!active) {
    return (
      <section className="rounded-2xl border border-brand/25 bg-brand-tint p-6">
        <div className="flex items-start gap-4">
          <IconPaw className="mt-1 h-6 w-6 shrink-0 text-brand" />
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-deep">{t("personal.ctaTitle")}</h2>
            <p className="mt-1 text-ink-soft">{t("personal.ctaText")}</p>
            <Link href={localePath(lang, "/my-pet")} className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-deep">
              {t("personal.ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (active.species !== species) {
    return (
      <section className="rounded-2xl border border-line bg-paper p-5 text-sm text-ink-soft">
        <IconPaw className="mr-2 inline h-4 w-4 text-brand-mid" />
        {t("personal.wrongSpecies", { name: active.name, food: speciesLabel(t, species, true), pet: speciesLabel(t, active.species, true) })}{" "}
        <Link href={localePath(lang, "/my-pet")} className="font-semibold text-brand underline underline-offset-2">{t("personal.switchPet")}</Link>
      </section>
    );
  }

  const fit = personalFit({ ...entry, ingredientsText }, active);
  const { allergy } = fit;
  const grade = gradeOf(fit.score);
  const petAllergens = [...active.allergens.map((a) => t(`allergen.${a}`)), ...active.customAllergens];
  const energy = dailyEnergy(active);
  const grams = entry.k ? gramsPerDay(energy.kcal, entry.k) : null;
  const pack = packGrams(entry.pk);
  const perDay = price && pack && grams ? (price / pack) * grams : null;
  const listNames = (ids: string[]) => ids.map((a) => (t(`allergen.${a}`).startsWith("allergen.") ? a : t(`allergen.${a}`))).join(", ");

  return (
    <section aria-labelledby="personal-h" className="rounded-2xl border border-brand/25 bg-paper p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-2">
        <IconPaw className="h-5 w-5 text-brand" />
        <h2 id="personal-h" className="font-display text-xl font-semibold text-brand-deep">{t("personal.title", { name: active.name })}</h2>
      </div>

      {/* allergies */}
      {allergy.excluded ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4" role="alert">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="text-sm text-ink">
            <p className="font-semibold text-danger">{t("personal.allergyBad", { name: active.name })}</p>
            {allergy.definite.length > 0 && <p className="mt-1">{t("personal.allergyDefinite", { list: listNames(allergy.definite) })}</p>}
            {allergy.possible.length > 0 && <p className="mt-1">{t("personal.allergyPossible", { list: listNames(allergy.possible) })}</p>}
          </div>
        </div>
      ) : petAllergens.length > 0 ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-grade-a/30 bg-grade-a-soft p-4 text-sm text-ink">
          <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-grade-a" />
          <div>
            <p className="font-semibold text-grade-a">{t("personal.allergyOk", { name: active.name })}</p>
            <p className="mt-1">{t("personal.allergyChecked", { list: petAllergens.join(", ") })}</p>
            {allergy.possible.length > 0 && <p className="mt-1 text-warn">{t("personal.allergyPossible", { list: listNames(allergy.possible) })}</p>}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">{t("personal.noAllergies", { name: active.name })}</p>
      )}

      {/* personal fit */}
      {fit.score !== null && !allergy.excluded && (
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            <ScoreRing score={fit.score} grade={grade} size={88} label={scoreAria(t, fit.score, grade)} />
            <div>
              <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">{t("personal.matchFor", { name: active.name })}</p>
              <p className={`font-display text-lg font-semibold ${grade ? GRADE_STYLE[grade].text : ""}`}>
                {fit.delta === 0 ? t("personal.sameAsBase") : t(fit.delta > 0 ? "personal.deltaUp" : "personal.deltaDown", { delta: Math.abs(fit.delta), name: active.name })}
              </p>
            </div>
          </div>
          {fit.notes.length > 0 && (
            <ul className="flex-1 space-y-2 text-[0.95rem]">
              {fit.notes.map((n, i) => (
                <li key={i} className="flex gap-2.5 leading-snug">
                  {n.good ? <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-grade-a" /> : <IconX className="mt-0.5 h-5 w-5 shrink-0 text-grade-e" />}
                  <span>{t(`personal.notes.${n.code}`, { ...(n.params ?? {}), name: active.name })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* portion + cost */}
      {grams !== null && !allergy.excluded && (
        <div className="mt-6 rounded-xl bg-cream/70 p-4">
          <p className="font-semibold text-brand-deep">{t("personal.portionTitle", { name: active.name })}</p>
          <p className="mt-1 text-[0.95rem]">
            {t("personal.portionText", { kcal: energy.kcal, grams })}
            {perDay !== null && <> {t("personal.costText", { cost: perDay.toFixed(2).replace(".", lang === "en" ? "." : ",") })}</>}
          </p>
          <p className="mt-2 text-xs text-ink-faint">{t(`personal.energyBasis.${energy.basis}`, { factor: energy.factor })} {t("personal.portionNote")}</p>
        </div>
      )}
    </section>
  );
}
