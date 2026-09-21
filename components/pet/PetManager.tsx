"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconCheck, IconInfo, IconPaw, IconX } from "@/components/ui/Icons";
import { localePath } from "@/lib/i18n/config";
import { dailyEnergy, lifeStageOf } from "@/lib/pets/energy";
import { newPetId, usePets } from "@/lib/pets/store";
import { ALLERGEN_IDS, COMMON_ALLERGENS } from "@/lib/scoring/allergens";
import type { ActivityLevel, BodyCondition, DogSize, PetProfile, Species } from "@/lib/scoring/types";

const blank = (species: Species = "dog"): PetProfile => ({
  id: newPetId(),
  name: "",
  species,
  weightKg: species === "dog" ? 15 : 4.2,
  neutered: true,
  activity: "moderate",
  bodyCondition: "ideal",
  dogSize: species === "dog" ? "medium" : undefined,
  ageYears: 3,
  allergens: [],
  customAllergens: [],
  strictAllergies: true,
});

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-paper px-4 text-base text-ink placeholder:text-ink-faint focus:border-brand-mid focus:outline-none focus:ring-4 focus:ring-brand-soft";
const labelCls = "mb-1.5 block text-sm font-semibold text-ink";

function Segmented<T extends string>({ value, onChange, options, name }: { value: T; onChange: (v: T) => void; options: Array<[T, string, string?]>; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2 sm:grid-flow-col sm:auto-cols-fr">
      {options.map(([v, label, hint]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-xl border px-4 py-3 text-left transition ${value === v ? "border-brand bg-brand-tint ring-2 ring-brand/30" : "border-line bg-paper hover:border-brand-mid/50"}`}
        >
          <span className="block font-semibold text-ink">{label}</span>
          {hint && <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>}
        </button>
      ))}
    </div>
  );
}

export function PetManager() {
  const t = useT();
  const lang = useLang();
  const { pets, active, save, remove, setActive } = usePets();
  const [blankPet] = useState(() => blank());
  // `edit` holds unsaved changes; without any, the form simply shows the stored active pet
  const [edit, setEdit] = useState<PetProfile | null>(null);
  const draft: PetProfile = edit ?? active ?? blankPet;
  const isSaved = pets.some((p) => p.id === draft.id);
  const [showAll, setShowAll] = useState(false);
  const [custom, setCustom] = useState("");
  const [ageChoice, setAgeChoice] = useState<"date" | "years" | null>(null);
  const ageMode = ageChoice ?? (draft.birthDate ? "date" : "years");
  const [saved, setSaved] = useState<PetProfile | null>(null);
  const [errors, setErrors] = useState<{ name?: boolean; weight?: boolean }>({});

  const set = <K extends keyof PetProfile>(key: K, value: PetProfile[K]) => setEdit({ ...draft, [key]: value });
  const setSpecies = (sp: Species) =>
    setEdit({
      ...draft,
      species: sp,
      dogSize: sp === "dog" ? (draft.dogSize ?? "medium") : undefined,
      weightKg: isSaved ? draft.weightKg : sp === "dog" ? 15 : 4.2,
      allergens: [],
    });

  const common = COMMON_ALLERGENS[draft.species];
  const rest = ALLERGEN_IDS.filter((a) => !common.includes(a));
  const chips = showAll ? [...common, ...rest] : common;

  const toggleAllergen = (id: string) =>
    set("allergens", draft.allergens.includes(id) ? draft.allergens.filter((a) => a !== id) : [...draft.allergens, id]);

  const addCustom = () => {
    const v = custom.trim();
    if (v.length < 2 || draft.customAllergens.some((c) => c.toLowerCase() === v.toLowerCase())) {
      setCustom("");
      return;
    }
    set("customAllergens", [...draft.customAllergens, v.slice(0, 40)]);
    setCustom("");
  };

  const preview = useMemo(() => {
    if (!draft.name.trim() || !(draft.weightKg > 0)) return null;
    return { stage: lifeStageOf(draft), energy: dailyEnergy(draft) };
  }, [draft]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { name: !draft.name.trim(), weight: !(draft.weightKg >= 0.5 && draft.weightKg <= 100) };
    setErrors(errs);
    if (errs.name || errs.weight) return;
    const pet: PetProfile = {
      ...draft,
      name: draft.name.trim().slice(0, 30),
      birthDate: ageMode === "date" ? draft.birthDate : undefined,
      ageYears: ageMode === "years" ? draft.ageYears : undefined,
    };
    save(pet);
    setEdit(null);
    setSaved(pet);
  };

  const startNew = () => {
    setEdit(blank(draft.species));
    setSaved(null);
    setAgeChoice("years");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pick = (id: string) => {
    setActive(id);
    setEdit(null);
    setAgeChoice(null);
    setSaved(null);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        {/* pet tabs */}
        {pets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t("pet.yourPets")}>
            {pets.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === draft.id}
                onClick={() => pick(p.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${p.id === draft.id ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink hover:border-brand-mid"}`}
              >
                <IconPaw className="h-4 w-4" /> {p.name}
              </button>
            ))}
            <button type="button" onClick={startNew} className="rounded-full border border-dashed border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-tint">
              + {t("pet.addAnother")}
            </button>
          </div>
        )}

        {/* 1. basics */}
        <fieldset className="space-y-5 rounded-2xl border border-line bg-paper p-6 shadow-card">
          <legend className="px-2 font-display text-xl font-semibold text-brand-deep">{t("pet.basicsTitle")}</legend>
          <div>
            <span className={labelCls}>{t("pet.species")}</span>
            <Segmented name={t("pet.species")} value={draft.species} onChange={setSpecies} options={[["dog", t("common.dog")], ["cat", t("common.cat")]]} />
          </div>
          <div>
            <label htmlFor="pet-name" className={labelCls}>{t("pet.name")}</label>
            <input id="pet-name" className={inputCls} value={draft.name} maxLength={30} onChange={(e) => set("name", e.target.value)} placeholder={t("pet.namePlaceholder")} aria-invalid={errors.name} aria-describedby={errors.name ? "name-err" : undefined} autoComplete="off" />
            {errors.name && <p id="name-err" className="mt-1 text-sm text-danger">{t("pet.nameRequired")}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="pet-age" className="text-sm font-semibold text-ink">{ageMode === "date" ? t("pet.birthDate") : t("pet.ageYears")}</label>
                <button type="button" className="text-xs font-semibold text-brand underline underline-offset-2" onClick={() => setAgeChoice(ageMode === "date" ? "years" : "date")}>
                  {ageMode === "date" ? t("pet.useAge") : t("pet.useBirthDate")}
                </button>
              </div>
              {ageMode === "date" ? (
                <input id="pet-age" type="date" className={inputCls} value={draft.birthDate ?? ""} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set("birthDate", e.target.value || undefined)} />
              ) : (
                <input id="pet-age" type="number" inputMode="decimal" min={0} max={30} step={0.5} className={inputCls} value={draft.ageYears ?? ""} onChange={(e) => set("ageYears", e.target.value === "" ? undefined : Number(e.target.value))} />
              )}
              <p className="mt-1 text-xs text-ink-faint">{t("pet.ageHint")}</p>
            </div>
            <div>
              <label htmlFor="pet-weight" className={labelCls}>{t("pet.weight")}</label>
              <input id="pet-weight" type="number" inputMode="decimal" min={0.5} max={100} step={0.1} className={inputCls} value={draft.weightKg || ""} onChange={(e) => set("weightKg", Number(e.target.value))} aria-invalid={errors.weight} />
              {errors.weight && <p className="mt-1 text-sm text-danger">{t("pet.weightInvalid")}</p>}
            </div>
          </div>
          {draft.species === "dog" && (
            <div>
              <span className={labelCls}>{t("pet.size")}</span>
              <Segmented<DogSize> name={t("pet.size")} value={draft.dogSize ?? "medium"} onChange={(v) => set("dogSize", v)} options={[["small", t("pet.sizeSmall"), "< 10 kg"], ["medium", t("pet.sizeMedium"), "10–25 kg"], ["large", t("pet.sizeLarge"), "25–45 kg"], ["giant", t("pet.sizeGiant"), "> 45 kg"]]} />
            </div>
          )}
          <div>
            <span className={labelCls}>{t("pet.neutered")}</span>
            <Segmented<"yes" | "no"> name={t("pet.neutered")} value={draft.neutered ? "yes" : "no"} onChange={(v) => set("neutered", v === "yes")} options={[["yes", t("common.yes")], ["no", t("common.no")]]} />
          </div>
        </fieldset>

        {/* 2. lifestyle */}
        <fieldset className="space-y-5 rounded-2xl border border-line bg-paper p-6 shadow-card">
          <legend className="px-2 font-display text-xl font-semibold text-brand-deep">{t("pet.lifestyleTitle")}</legend>
          <div>
            <span className={labelCls}>{t("pet.activity")}</span>
            <Segmented<ActivityLevel> name={t("pet.activity")} value={draft.activity} onChange={(v) => set("activity", v)} options={[["low", t("pet.activityLow"), t(`pet.activityLowHint.${draft.species}`)], ["moderate", t("pet.activityMod"), t(`pet.activityModHint.${draft.species}`)], ["high", t("pet.activityHigh"), t(`pet.activityHighHint.${draft.species}`)]]} />
          </div>
          <div>
            <span className={labelCls}>{t("pet.condition")}</span>
            <Segmented<BodyCondition> name={t("pet.condition")} value={draft.bodyCondition} onChange={(v) => set("bodyCondition", v)} options={[["underweight", t("pet.condUnder"), t("pet.condUnderHint")], ["ideal", t("pet.condIdeal"), t("pet.condIdealHint")], ["overweight", t("pet.condOver"), t("pet.condOverHint")]]} />
          </div>
          <div className="space-y-3">
            {draft.species === "cat" && (
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 h-5 w-5 rounded accent-brand" checked={!!draft.urinaryIssues} onChange={(e) => set("urinaryIssues", e.target.checked)} />
                <span><span className="font-semibold text-ink">{t("pet.urinary")}</span><span className="block text-sm text-ink-faint">{t("pet.urinaryHint")}</span></span>
              </label>
            )}
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 rounded accent-brand" checked={!!draft.sensitiveDigestion} onChange={(e) => set("sensitiveDigestion", e.target.checked)} />
              <span><span className="font-semibold text-ink">{t("pet.digestion")}</span><span className="block text-sm text-ink-faint">{t("pet.digestionHint")}</span></span>
            </label>
          </div>
        </fieldset>

        {/* 3. allergies */}
        <fieldset className="space-y-5 rounded-2xl border border-line bg-paper p-6 shadow-card">
          <legend className="px-2 font-display text-xl font-semibold text-brand-deep">{t("pet.allergyTitle")}</legend>
          <p className="text-sm text-ink-soft">{t("pet.allergyIntro")}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("pet.allergyTitle")}>
            {chips.map((a) => {
              const on = draft.allergens.includes(a);
              return (
                <button key={a} type="button" aria-pressed={on} onClick={() => toggleAllergen(a)} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-danger bg-danger-soft text-danger" : "border-line bg-paper text-ink hover:border-brand-mid"}`}>
                  {on && <IconX className="h-3.5 w-3.5" />}
                  {t(`allergen.${a}`)}
                </button>
              );
            })}
          </div>
          {!showAll && rest.length > 0 && (
            <button type="button" className="text-sm font-semibold text-brand underline underline-offset-2" onClick={() => setShowAll(true)}>
              {t("pet.showMoreAllergens", { count: rest.length })}
            </button>
          )}
          <div>
            <label htmlFor="allergy-custom" className={labelCls}>{t("pet.customAllergy")}</label>
            <div className="flex gap-2">
              <input id="allergy-custom" className={inputCls} value={custom} maxLength={40} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder={t("pet.customPlaceholder")} />
              <button type="button" onClick={addCustom} className="shrink-0 rounded-xl border border-brand px-5 font-semibold text-brand hover:bg-brand-tint">{t("common.add")}</button>
            </div>
            {draft.customAllergens.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {draft.customAllergens.map((c) => (
                  <li key={c}>
                    <button type="button" onClick={() => set("customAllergens", draft.customAllergens.filter((x) => x !== c))} className="inline-flex items-center gap-1.5 rounded-full border border-danger bg-danger-soft px-3 py-1.5 text-sm font-medium text-danger" aria-label={t("pet.removeAllergen", { name: c })}>
                      {c} <IconX className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream/70 p-4">
            <input type="checkbox" className="mt-1 h-5 w-5 rounded accent-brand" checked={draft.strictAllergies} onChange={(e) => set("strictAllergies", e.target.checked)} />
            <span><span className="font-semibold text-ink">{t("pet.strict")}</span><span className="block text-sm text-ink-soft">{t("pet.strictHint")}</span></span>
          </label>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-card transition hover:bg-brand-deep">
            {isSaved ? t("pet.saveChanges") : t("pet.save")}
          </button>
          {isSaved && (
            <button
              type="button"
              className="rounded-xl border border-line px-5 py-3.5 font-semibold text-danger hover:bg-danger-soft"
              onClick={() => {
                if (window.confirm(t("pet.confirmDelete", { name: draft.name }))) {
                  remove(draft.id);
                  setEdit(null);
                  setAgeChoice(null);
                  setSaved(null);
                }
              }}
            >
              {t("pet.delete")}
            </button>
          )}
        </div>

        {saved && (
          <div className="flex flex-col gap-4 rounded-2xl border border-grade-a/30 bg-grade-a-soft p-5 sm:flex-row sm:items-center sm:justify-between" role="status">
            <p className="flex items-center gap-2 font-semibold text-grade-a"><IconCheck className="h-5 w-5" /> {t("pet.saved", { name: saved.name })}</p>
            <Link href={`${localePath(lang, "/foods")}?species=${saved.species}`} className="rounded-xl bg-brand px-6 py-3 text-center font-semibold text-white hover:bg-brand-deep">
              {t("pet.seeFoods", { name: saved.name })}
            </Link>
          </div>
        )}
      </form>

      {/* live summary */}
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-2xl border border-brand/25 bg-brand-tint p-6" aria-live="polite">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-brand-deep"><IconPaw className="h-5 w-5" />{draft.name.trim() || t("pet.previewTitle")}</h2>
          {preview ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-ink-faint">{t("pet.previewStage")}</dt><dd className="font-semibold text-ink">{t(`pet.stage.${preview.stage}`)}</dd></div>
              <div><dt className="text-ink-faint">{t("pet.previewEnergy")}</dt><dd className="font-mono text-2xl font-semibold text-brand-deep">{preview.energy.kcal} <span className="text-sm font-normal text-ink-soft">kcal / {t("common.day")}</span></dd></div>
              <div><dt className="text-ink-faint">{t("pet.previewAllergies")}</dt><dd className="font-semibold text-ink">{draft.allergens.length + draft.customAllergens.length === 0 ? t("pet.none") : [...draft.allergens.map((a) => t(`allergen.${a}`)), ...draft.customAllergens].join(", ")}</dd></div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{t("pet.previewEmpty")}</p>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-paper p-5 text-sm text-ink-soft">
          <p className="flex gap-2"><IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid" /> {t("pet.privacyNote")}</p>
        </section>
      </aside>
    </div>
  );
}
