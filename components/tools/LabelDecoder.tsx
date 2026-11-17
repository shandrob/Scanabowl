"use client";

import { useMemo, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IngredientInspector } from "@/components/product/IngredientInspector";
import { GRADE_STYLE } from "@/components/ui/grade";
import { IconAlert, IconCheck, IconInfo, IconX } from "@/components/ui/Icons";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { IngredientView } from "@/lib/data/types";
import { foodTypeLabel, gradeLabel, kindGroup, scoreAria, speciesLabel, stageLabel, type KindGroup } from "@/lib/labels";
import { detectAllergens } from "@/lib/scoring/allergens";
import { scoreProduct } from "@/lib/scoring/score";
import { splitGroups } from "@/lib/scoring/splitting";
import { translateIngredient } from "@/lib/scoring/translate-ingredient";
import type { FoodType, LifeStage, Species } from "@/lib/scoring/types";

const GROUP_STYLE: Record<KindGroup, string> = {
  animal: "#2D6A4F",
  fat: "#1F4E3D",
  plant: "#B45309",
  other: "#6B6A65",
};

interface Preset {
  key: "exHighDog" | "exSupermarket" | "exCatWet";
  species: Species;
  foodType: FoodType;
  lifeStage: LifeStage;
  ingredients: string;
  protein: string;
  fat: string;
  fibre: string;
  ash: string;
  moisture: string;
}

const PRESETS: Preset[] = [
  {
    key: "exHighDog",
    species: "dog",
    foodType: "dry",
    lifeStage: "adult",
    ingredients:
      "Fresh chicken (28%), dried turkey (24%), sweet potato, peas, chicken fat (5%), salmon oil (2%), beet pulp, chicory root (FOS), glucosamine, chondroitin.",
    protein: "32",
    fat: "17",
    fibre: "3",
    ash: "7.5",
    moisture: "9",
  },
  {
    key: "exSupermarket",
    species: "dog",
    foodType: "dry",
    lifeStage: "adult",
    ingredients:
      "Cereals, meat and animal derivatives (including 4% beef), vegetable by-products, oils and fats, various sugars, minerals, colourants.",
    protein: "21",
    fat: "10",
    fibre: "3.5",
    ash: "8",
    moisture: "10",
  },
  {
    key: "exCatWet",
    species: "cat",
    foodType: "wet",
    lifeStage: "adult",
    ingredients:
      "Chicken breast (45%), chicken liver (15%), chicken broth, salmon oil (1%), minerals, taurine.",
    protein: "11.5",
    fat: "5.5",
    fibre: "0.4",
    ash: "2.1",
    moisture: "79",
  },
];

export function LabelDecoder() {
  const t = useT();
  const lang = useLang();
  const [species, setSpecies] = useState<Species>("dog");
  const [foodType, setFoodType] = useState<FoodType>("dry");
  const [lifeStage, setLifeStage] = useState<LifeStage>("adult");
  const [ingredientsText, setIngredientsText] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [fibre, setFibre] = useState("");
  const [ash, setAsh] = useState("");
  const [moisture, setMoisture] = useState("");

  const applyPreset = (p: Preset) => {
    setSpecies(p.species);
    setFoodType(p.foodType);
    setLifeStage(p.lifeStage);
    setIngredientsText(p.ingredients);
    setProtein(p.protein);
    setFat(p.fat);
    setFibre(p.fibre);
    setAsh(p.ash);
    setMoisture(p.moisture);
    setShowAnalysis(true);
  };

  const decoded = useMemo(() => {
    const trimmed = ingredientsText.trim();
    if (trimmed.length < 3) return null;

    const analysisParts: string[] = [];
    if (protein.trim()) analysisParts.push(`Ruw eiwit ${protein.trim()}%`);
    if (fat.trim()) analysisParts.push(`Ruw vet ${fat.trim()}%`);
    if (fibre.trim()) analysisParts.push(`Ruwe celstof ${fibre.trim()}%`);
    if (ash.trim()) analysisParts.push(`Ruwe as ${ash.trim()}%`);
    if (moisture.trim()) analysisParts.push(`Vocht ${moisture.trim()}%`);

    const result = scoreProduct({
      species,
      foodType,
      lifeStage,
      category: "complete",
      ingredients: trimmed,
      analysis: analysisParts.join(", "),
    });

    const ingredients: IngredientView[] = result.ingredients.map((i) => ({
      raw: i.raw,
      kind: i.info.kind,
      share: Math.round(i.share * 1000) / 10,
      ...(i.pct !== undefined ? { pct: i.pct } : {}),
      named: i.info.clarity >= 0.5,
    }));

    const totals: Record<KindGroup, number> = { animal: 0, fat: 0, plant: 0, other: 0 };
    for (const i of ingredients) totals[kindGroup(i.kind)] += i.share;
    const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const splits = splitGroups(ingredients).slice(0, 2);
    const allergens = detectAllergens(trimmed);

    return { result, ingredients, totals, sum, splits, allergens };
  }, [species, foodType, lifeStage, ingredientsText, protein, fat, fibre, ash, moisture]);

  const inputCls =
    "h-10 w-full rounded-xl border border-line bg-paper px-3 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft";
  const order: KindGroup[] = ["animal", "fat", "plant", "other"];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Left: Input Form */}
      <section className="space-y-5 rounded-2xl border border-line bg-paper p-6 shadow-card lg:self-start">
        <div>
          <p className="font-sans text-xs font-semibold text-ink-soft">{t("decoder.examplesLabel")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-full border border-[#E2DDD5] bg-cream px-3.5 py-1.5 font-sans text-xs font-semibold text-brand-deep transition hover:border-brand-mid hover:bg-brand-soft"
              >
                {t(`decoder.${p.key}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="dec-sp" className="mb-1 block font-sans text-xs font-semibold text-ink-soft">
              {t("decoder.speciesLabel")}
            </label>
            <select
              id="dec-sp"
              value={species}
              onChange={(e) => setSpecies(e.target.value as Species)}
              className={inputCls}
            >
              <option value="dog">{speciesLabel(t, "dog")}</option>
              <option value="cat">{speciesLabel(t, "cat")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="dec-type" className="mb-1 block font-sans text-xs font-semibold text-ink-soft">
              {t("decoder.typeLabel")}
            </label>
            <select
              id="dec-type"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value as FoodType)}
              className={inputCls}
            >
              {(["dry", "wet", "frozen"] as const).map((ft) => (
                <option key={ft} value={ft}>{foodTypeLabel(t, ft)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dec-stage" className="mb-1 block font-sans text-xs font-semibold text-ink-soft">
              {t("decoder.stageLabel")}
            </label>
            <select
              id="dec-stage"
              value={lifeStage}
              onChange={(e) => setLifeStage(e.target.value as LifeStage)}
              className={inputCls}
            >
              {(["adult", "young", "senior"] as const).map((ls) => (
                <option key={ls} value={ls}>{stageLabel(t, ls, species)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dec-ing" className="mb-1.5 block font-sans text-sm font-semibold text-ink">
            {t("decoder.ingredientsLabel")}
          </label>
          <textarea
            id="dec-ing"
            rows={5}
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={t("decoder.ingredientsPlaceholder")}
            className="w-full rounded-xl border border-line bg-paper p-3.5 font-sans text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
          />
        </div>

        <div className="rounded-xl border border-line bg-cream/60 p-4">
          <button
            type="button"
            onClick={() => setShowAnalysis((v) => !v)}
            aria-expanded={showAnalysis}
            className="flex w-full items-center justify-between font-sans text-xs font-semibold text-brand-deep"
          >
            <span>{t("decoder.analysisToggle")}</span>
            <span aria-hidden>{showAnalysis ? "−" : "+"}</span>
          </button>
          {showAnalysis && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["dec-p", t("decoder.protein"), protein, setProtein],
                ["dec-f", t("decoder.fat"), fat, setFat],
                ["dec-fi", t("decoder.fibre"), fibre, setFibre],
                ["dec-a", t("decoder.ash"), ash, setAsh],
                ["dec-m", t("decoder.moisture"), moisture, setMoisture],
              ].map(([id, labelText, val, setter]) => (
                <div key={id as string}>
                  <label htmlFor={id as string} className="mb-1 block font-sans text-xs text-ink-soft">
                    {labelText as string}
                  </label>
                  <input
                    id={id as string}
                    type="text"
                    inputMode="decimal"
                    value={val as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    placeholder="—"
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Right: Live Analysis Output */}
      <div className="space-y-6">
        {!decoded ? (
          <section className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
            <h2 className="font-display text-2xl font-semibold text-brand-deep">{t("decoder.emptyTitle")}</h2>
            <p className="mt-2 max-w-md font-sans text-sm leading-relaxed text-ink-soft">{t("decoder.emptyText")}</p>
          </section>
        ) : (
          <>
            {decoded.result.score !== null && decoded.result.grade && decoded.result.pillars ? (
              <section className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <ScoreRing
                    score={decoded.result.score}
                    grade={decoded.result.grade}
                    size={112}
                    label={scoreAria(t, decoded.result.score, decoded.result.grade)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs font-semibold text-ink-soft">{t("product.scoreTitle")}</p>
                    <p className={`mt-0.5 font-display text-3xl font-semibold ${GRADE_STYLE[decoded.result.grade].text}`}>
                      {gradeLabel(t, decoded.result.grade)}
                    </p>
                    <p className="mt-1 font-sans text-sm text-ink-soft">{t(`grade.desc.${decoded.result.grade}`)}</p>
                  </div>
                </div>

                {decoded.result.flags.filter((f) => f.severity === "hazard").length > 0 && (
                  <div className="mt-5 flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-danger" role="alert">
                    <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-sans text-sm font-semibold">{t("product.hazardTitle")}</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-ink">
                        {decoded.result.flags
                          .filter((f) => f.severity === "hazard")
                          .map((f) => (
                            <li key={f.code}>{t(`flags.${f.code}`)}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ["nutrition", decoded.result.pillars.nutrition, "#1E4D3B"],
                      ["ingredients", decoded.result.pillars.ingredients, "#163A2C"],
                      ["formulation", decoded.result.pillars.formulation, "#16A34A"],
                    ] as const
                  ).map(([k, p, color]) => (
                    <div key={k}>
                      <div className="flex items-baseline justify-between font-sans text-xs">
                        <span className="font-semibold text-ink">{t(`score.pillars.${k}`)}</span>
                        <span className="tabular-nums text-ink-soft">
                          <strong className="text-ink">{p.points}</strong> / {p.max}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((p.points / p.max) * 100)}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 border-t border-line pt-5 md:grid-cols-2">
                  <div>
                    <h3 className="font-sans text-xs font-semibold text-grade-a">{t("product.goodTitle")}</h3>
                    <ul className="mt-2.5 space-y-2">
                      {decoded.result.positives.map((r) => (
                        <li key={r.code} className="flex gap-2 text-sm leading-snug">
                          <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" />
                          <span>
                            {t(`reasons.${r.code}`, {
                              ...(r.params ?? {}),
                              ...(typeof r.params?.name === "string"
                                ? { name: translateIngredient(r.params.name, lang) }
                                : {}),
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-sans text-xs font-semibold text-grade-e">{t("product.badTitle")}</h3>
                    <ul className="mt-2.5 space-y-2">
                      {decoded.result.negatives.map((r) => (
                        <li key={r.code} className="flex gap-2 text-sm leading-snug">
                          <IconX className="mt-0.5 h-4 w-4 shrink-0 text-grade-e" />
                          <span>
                            {t(`reasons.${r.code}`, {
                              ...(r.params ?? {}),
                              ...(typeof r.params?.name === "string"
                                ? { name: translateIngredient(r.params.name, lang) }
                                : {}),
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-sm text-ink">
                <p className="flex items-center gap-2 font-semibold">
                  <IconInfo className="h-5 w-5 text-warn" />
                  {t(`product.notScored.${decoded.result.notScored ?? "ingredients_unclear"}`)}
                </p>
              </section>
            )}

            {/* Ingredient Breakdown + Interactive Chips */}
            {decoded.ingredients.length > 0 && (
              <section className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
                <h2 className="font-display text-xl font-semibold text-ink">{t("product.ingredientsTitle")}</h2>
                <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-stone">
                  {order.map((g) => (
                    <div key={g} style={{ width: `${(decoded.totals[g] / decoded.sum) * 100}%`, background: GROUP_STYLE[g] }} />
                  ))}
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-sans text-xs tabular-nums text-ink-soft">
                  {order.map((g) => (
                    <li key={g} className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: GROUP_STYLE[g] }} aria-hidden />
                      {t(`product.group.${g}`)} ≈ {Math.round((decoded.totals[g] / decoded.sum) * 100)}%
                    </li>
                  ))}
                </ul>

                <IngredientInspector ingredients={decoded.ingredients} />

                {decoded.splits.map((g) => (
                  <p key={g.forms.join("|")} className="mt-4 flex gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-ink">
                    <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
                    <span>
                      <strong>{t("product.splitTitle")}</strong>{" "}
                      {t(g.outweighsFirst ? "product.splitTextFirst" : "product.splitText", {
                        count: g.forms.length,
                        forms: g.forms.map((f) => translateIngredient(f, lang)).join(", "),
                        pct: g.share,
                        first: translateIngredient(decoded.ingredients[0].raw, lang),
                      })}
                    </span>
                  </p>
                ))}
              </section>
            )}

            {/* Allergen Detection Summary */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-ink">{t("decoder.allergensTitle")}</h2>
              {decoded.allergens.definite.length === 0 && decoded.allergens.possible.length === 0 ? (
                <p className="mt-2 font-sans text-sm text-ink-soft">{t("decoder.allergensNone")}</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {decoded.allergens.definite.length > 0 && (
                    <div>
                      <p className="font-sans text-xs font-semibold text-danger">{t("decoder.allergensDefinite")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {decoded.allergens.definite.map((a) => (
                          <span key={a} className="rounded-full border border-danger/30 bg-danger-soft px-3 py-1 font-sans text-xs font-semibold text-danger">
                            {t(`allergen.${a}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {decoded.allergens.possible.length > 0 && (
                    <div>
                      <p className="font-sans text-xs font-semibold text-warn">{t("decoder.allergensPossible")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {decoded.allergens.possible.map((a) => (
                          <span key={a} className="rounded-full border border-warn/30 bg-warn-soft px-3 py-1 font-sans text-xs font-semibold text-ink">
                            {t(`allergen.${a}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <p className="font-sans text-xs leading-relaxed text-ink-faint">{t("decoder.disclaimer")}</p>
          </>
        )}
      </div>
    </div>
  );
}
