import type {
  Flag,
  Grade,
  IngredientKind,
  ParsedIngredient,
  Pillar,
  ProductInput,
  Reason,
  ScoreResult,
  Species,
} from "./types";
import { parseAnalysis, coreCount } from "./parse-analysis";
import { parseIngredients } from "./parse-ingredients";
import { computeNutrition, FEDIAF_MIN } from "./nutrition";
import { CEREAL_KINDS, isAnimalProtein } from "./taxonomy";
import { clamp, lin, normalize, round } from "./text";

/**
 * Scanabowl Score - full description on the public methodology page and in docs/SCORING.md.
 *
 *   Nutrient profile      35 pts   the numbers on the pack against what the species needs (FEDIAF, NRC)
 *   Ingredient quality    50 pts   where the protein comes from and how clearly it is declared
 *   Clean formulation     15 pts   deductions for sugar, colourants, synthetic preservatives, filler load
 *
 * Toxic ingredients cap the total at 25 whatever else is in the recipe.
 * The score can only describe what is printed on the pack. It cannot see digestibility,
 * manufacturing quality control or feeding-trial evidence (WSAVA Global Nutrition Committee).
 */

export const GRADE_LIMITS: Array<[Grade, number]> = [
  ["A", 85],
  ["B", 72],
  ["C", 58],
  ["D", 42],
];

export function gradeFor(score: number): Grade {
  for (const [g, min] of GRADE_LIMITS) if (score >= min) return g;
  return "E";
}

const HAZARDS: Array<{ code: string; re: RegExp; species: Species[]; severity: "hazard" | "concern" }> = [
  { code: "onion", re: /(?<![a-z])(uien?(?![a-z])|uipoeder|uiextract|onions?(?![a-z])|onion powder|zwiebel\w*|oignons?)/, species: ["dog", "cat"], severity: "hazard" },
  { code: "garlic", re: /(?<![a-z])(knoflook\w*|garlic|knoblauch|ail(?![a-z]))/, species: ["cat"], severity: "hazard" },
  { code: "garlic_dog", re: /(?<![a-z])(knoflook\w*|garlic|knoblauch|ail(?![a-z]))/, species: ["dog"], severity: "concern" },
  { code: "xylitol", re: /(?<![a-z])(xylitol|xylit)/, species: ["dog", "cat"], severity: "hazard" },
  { code: "raisins", re: /(?<![a-z])(rozijnen|raisins?|sultanas?|krenten|currants?|trauben|rosinen)/, species: ["dog"], severity: "hazard" },
  { code: "grapes", re: /(?<![a-z])(druiven|druif|grapes?)(?![a-z]*(?:pit|pip|seed|extract|pulp|puree|expeller|kern))(?![^,]{0,40}(?:polyfenol|aromatisch))/, species: ["dog"], severity: "concern" },
  { code: "chocolate", re: /(?<![a-z])(chocolade\w*|cacao\w*|cocoa|chocolate|kakao\w*|theobromine)/, species: ["dog", "cat"], severity: "hazard" },
  { code: "macadamia", re: /macadamia/, species: ["dog", "cat"], severity: "hazard" },
  { code: "propylene_glycol", re: /(propyleenglycol|propylene glycol|propane-1,2-diol|e ?1520|propylenglykol)/, species: ["cat"], severity: "hazard" },
];

function pillar(points: number, max: number): Pillar {
  return { points: round(clamp(points, 0, max), 1), max };
}

function kindShare(ings: ParsedIngredient[], kinds: IngredientKind[]): number {
  const set = new Set(kinds);
  return ings.filter((i) => set.has(i.info.kind)).reduce((s, i) => s + i.share, 0);
}

function leadValue(i: ParsedIngredient | undefined): number {
  if (!i || !isAnimalProtein(i.info.kind)) return 0;
  return 0.4 + 0.6 * i.info.clarity;
}

const ANIMAL_DM_KINDS = new Set<IngredientKind>([
  "meat",
  "fish",
  "egg",
  "dairy",
  "generic_animal",
  "animal_extract",
  "insect",
  "animal_fat",
  "fish_oil",
]);

const ANIMAL_NAME_RE =
  /(?<![a-z])(kip|kalkoen|eend|gans|rund|lam|zalm|vis|tonijn|gevogelte|konijn|wild|hert|vlees|haring|makreel|forel|chicken|beef|lamb|turkey|duck|salmon|fish|tuna|meat|poultry|rabbit|venison)(?![a-z])/;

type Weighted = Reason & { w: number };

export function scoreProduct(input: ProductInput): ScoreResult {
  const { species, lifeStage } = input;
  const parsed = parseIngredients(input.ingredients);
  const ings = parsed.ingredients;
  const analysis = parseAnalysis(input.analysis);
  const nutrition = computeNutrition(species, input.foodType, analysis);

  const base: ScoreResult = {
    score: null,
    grade: null,
    pillars: null,
    positives: [],
    negatives: [],
    flags: [],
    confidence: "low",
    animalProteinShare: null,
    animalDmShare: null,
    nutrition,
    ingredients: ings,
    grainFree: ings.length > 0 && !ings.some((i) => CEREAL_KINDS.has(i.info.kind)),
  };

  if (input.category !== "complete") return { ...base, notScored: input.category };
  if (ings.length === 0) return { ...base, notScored: "no_ingredients" };
  // A list without any animal ingredient is almost certainly a scraper glitch (marketing text, vitamin
  // premix) when it is a cat food, when the food is named after an animal, or when most of the "ingredients"
  // are not ingredients at all. Genuine plant-based dog foods still get a score. Better no score than a wrong one.
  if (!ings.some((i) => ANIMAL_DM_KINDS.has(i.info.kind))) {
    const recognised = ings.filter((i) => i.info.kind !== "other").length / ings.length;
    if (species === "cat" || ANIMAL_NAME_RE.test(normalize(input.name ?? "")) || recognised < 0.4) {
      return { ...base, notScored: "ingredients_unclear" };
    }
  }

  const positives: Weighted[] = [];
  const negatives: Weighted[] = [];
  const flags: Flag[] = [];
  const stage = lifeStage === "young" ? "young" : "adult";
  const ref = FEDIAF_MIN[species][stage];
  const cat = species === "cat";

  // ------------------------------------------------------------------ ingredient metrics
  let animalP = 0;
  let namedP = 0;
  let plantP = 0;
  let isolateP = 0;
  let animalDm = 0;
  let totalDm = 0;
  for (const i of ings) {
    const c = i.share * i.info.protein;
    if (isAnimalProtein(i.info.kind)) {
      animalP += c;
      namedP += c * i.info.clarity;
    } else {
      plantP += c;
      if (i.info.kind === "cereal_protein" || i.info.kind === "legume_protein") isolateP += c;
    }
    const dm = i.share * i.info.dm;
    totalDm += dm;
    if (ANIMAL_DM_KINDS.has(i.info.kind)) animalDm += dm;
  }
  const totalP = animalP + plantP;
  const animalShare = totalP > 0 ? animalP / totalP : 0;
  const animalDmShare = totalDm > 0 ? animalDm / totalDm : 0;
  const namedShare = animalP > 0 ? namedP / animalP : 0;
  const isolateShare = totalP > 0 ? isolateP / totalP : 0;
  const cerealShare = kindShare(ings, ["cereal", "cereal_protein"]);
  const pulseShare = kindShare(ings, ["legume", "legume_protein", "tuber"]);
  const lead = ings.filter((i) => !/^(water|aqua|eau|wasser)$/.test(normalize(i.raw)) && i.info.kind !== "broth");

  // ------------------------------------------------------------------ B. ingredient quality (50)
  // B1 (24): protein origin (12) and animal share of the dry matter (12)
  const fP = lin(
    animalShare,
    cat ? [[0.35, 0], [0.55, 0.3], [0.72, 0.6], [0.86, 0.82], [0.96, 0.95], [1, 1]] : [[0.2, 0], [0.4, 0.3], [0.6, 0.6], [0.78, 0.82], [0.92, 0.95], [1, 1]],
  );
  const fM = lin(
    animalDmShare,
    cat ? [[0.2, 0], [0.4, 0.3], [0.55, 0.58], [0.7, 0.8], [0.85, 0.93], [0.95, 1]] : [[0.1, 0], [0.25, 0.3], [0.4, 0.58], [0.55, 0.8], [0.7, 0.93], [0.85, 1]],
  );
  const b1 = 12 * fP + 12 * fM;
  // B2 (10): what leads the list
  const v0 = leadValue(lead[0]);
  const v1 = leadValue(lead[1]);
  const b2 = 6.5 * v0 + (v0 > 0 ? 3.5 * v1 : 1.5 * v1);
  // B3 (10): named sources instead of "animal derivatives"
  const vagueCount = ings.filter((i) => i.info.tags.includes("vague_plant")).length;
  const b3 = Math.max(0, 10 * namedShare - Math.min(2, vagueCount));
  // B4 (6): useful extras
  const tagSet = new Set(ings.flatMap((i) => i.info.tags));
  const additiveText = normalize(parsed.additivesText);
  const allText = normalize(`${parsed.compositionText} ${parsed.additivesText}`);
  let b4 = 0;
  if (tagSet.has("omega3")) b4 += 2;
  if (tagSet.has("prebiotic")) b4 += 1.5;
  if (tagSet.has("joint")) b4 += 1;
  if (tagSet.has("probiotic")) b4 += 1;
  if (tagSet.has("natural_antioxidant")) b4 += 0.5;
  if (cat && (tagSet.has("taurine") || (analysis.taurine ?? 0) > 0)) b4 += 0.5;
  b4 = Math.min(6, b4);

  // ------------------------------------------------------------------ C. clean formulation (15)
  let c = 15;
  const deduct = (points: number, code: string, params?: Record<string, string | number>) => {
    c -= points;
    negatives.push({ code, ...(params ? { params } : {}), w: points * 1.5 });
  };
  const kinds = new Set(ings.map((i) => i.info.kind));
  if (kinds.has("sugar")) deduct(cat ? 4.5 : 4, "sugar");
  if (kinds.has("colourant") || /(kleurstof|colou?rant|farbstoff|e1\d\d)/.test(additiveText)) deduct(3, "colourant");
  if (kinds.has("preservative") || /(bha|bht|ethoxyquin|propylgallaat|propyl gallate|sorbaat|nitriet)/.test(additiveText)) {
    deduct(2.5, "preservative");
  }
  if (cat) {
    const d = isolateShare >= 0.25 ? 4.5 : isolateShare >= 0.12 ? 2 : 0;
    if (d) deduct(d, "plant_protein_isolates", { pct: round(isolateShare * 100) });
    const d2 = cerealShare >= 0.35 ? 3 : cerealShare >= 0.2 ? 1.5 : 0;
    if (d2) deduct(d2, "cereal_filler", { pct: round(cerealShare * 100) });
  } else {
    if (isolateShare >= 0.35) deduct(2, "plant_protein_isolates", { pct: round(isolateShare * 100) });
    const d2 = pulseShare >= 0.3 ? 3 : pulseShare >= 0.2 ? 1.5 : 0;
    if (d2) deduct(d2, "legume_heavy", { pct: round(pulseShare * 100) });
  }

  let hazard = false;
  for (const h of HAZARDS) {
    if (!h.species.includes(species) || !h.re.test(allText)) continue;
    flags.push({ code: h.code, severity: h.severity });
    if (h.severity === "hazard") hazard = true;
    else c -= 4.5;
  }

  // ------------------------------------------------------------------ A. nutrient profile (35)
  let a = 0;
  let confidence: ScoreResult["confidence"] = "low";
  if (!nutrition) {
    a = 35 * 0.5;
    negatives.push({ code: "analysis_missing", w: 8 });
  } else {
    const n = nutrition;
    const shift = stage === "young" ? (cat ? 3 : 4) : 0;
    const carbs = n.energyShare.carbs;
    if (cat) {
      const pf = lin(n.dm.protein - shift, [[20, 0], [25, 0.25], [33, 0.58], [40, 0.83], [48, 1], [70, 1]]);
      const ff = lin(n.dm.fat, [[7, 0], [9, 0.3], [14, 0.8], [20, 1], [38, 1], [48, 0.6], [58, 0.2]]);
      const cf = lin(carbs, [[0, 1], [10, 1], [20, 0.82], [30, 0.55], [40, 0.27], [50, 0.09], [60, 0]]);
      const fa = lin(n.dm.fibre, [[0, 1], [6, 1], [10, 0.5], [14, 0]]) * 1.5 + lin(n.dm.ash, [[0, 1], [10, 1], [13, 0.5], [16, 0]]) * 1.5;
      const hy = lin(n.asFed.moisture, [[8, 0], [20, 0.1], [50, 0.5], [70, 0.85], [76, 1]]);
      a = 12 * pf + 2.5 * ff + 10 * cf + fa + 7.5 * hy;
      if (pf >= 0.85) positives.push({ code: "protein_level_good", params: { pct: round(n.dm.protein) }, w: 12 * pf });
      if (pf < 0.5) negatives.push({ code: "protein_low", params: { pct: round(n.dm.protein) }, w: 12 * (1 - pf) });
      if (carbs <= 15) positives.push({ code: "low_carb", params: { pct: round(carbs) }, w: 10 * cf });
      if (carbs >= 30) negatives.push({ code: "carbs_high", params: { pct: round(carbs) }, w: 10 * (1 - cf) });
      if (n.asFed.moisture >= 65) positives.push({ code: "high_moisture", params: { pct: round(n.asFed.moisture) }, w: 7.5 * hy });
      if (n.asFed.moisture < 20) negatives.push({ code: "dry_food_cat", params: { pct: round(n.asFed.moisture) }, w: 7.5 * (1 - hy) });
      if (n.dm.fibre > 10) negatives.push({ code: "fibre_high", params: { pct: round(n.dm.fibre) }, w: 2 });
      if (n.dm.ash > 12) negatives.push({ code: "ash_high", params: { pct: round(n.dm.ash) }, w: 2 });
      if (n.dm.fat < 9) negatives.push({ code: "fat_low", params: { pct: round(n.dm.fat) }, w: 3 });
    } else {
      const pf = lin(n.dm.protein - shift, [[14, 0], [18, 0.3], [21, 0.55], [25, 0.75], [30, 0.92], [34, 1], [55, 1], [70, 0.9]]);
      const ff = lin(n.dm.fat - (stage === "young" ? 3 : 0), [[4, 0], [5.5, 0.35], [8, 0.6], [12, 0.85], [15, 1], [24, 1], [30, 0.8], [38, 0.45], [46, 0.15]]);
      const cf = lin(carbs, [[0, 1], [30, 1], [42, 0.8], [52, 0.55], [62, 0.25], [75, 0]]);
      const fibreP = 2 * lin(n.dm.fibre, [[0, 0.5], [1.5, 1], [5, 1], [8, 0.5], [12, 0]]);
      const ashP = 2 * lin(n.dm.ash, [[0, 1], [8, 1], [10.5, 0.65], [13, 0.2], [16, 0]]);
      let integrity = 4 * (coreCount(analysis) / 5);
      const ca = n.dm.calcium;
      const ph = n.dm.phosphorus;
      if (ca !== undefined && ph !== undefined && ph > 0) {
        const r = ca / ph;
        if (r >= 1 && r <= 2) integrity += 5;
        else if ((r >= 0.8 && r < 1) || (r > 2 && r <= 2.4)) integrity += 3;
        else {
          integrity += 0.5;
          negatives.push({ code: "calcium_phosphorus", params: { ratio: round(r, 1) }, w: 3 });
        }
      } else integrity += 2.5;
      a = 12 * pf + 6 * ff + 4 * cf + fibreP + ashP + integrity;
      if (pf >= 0.9) positives.push({ code: "protein_level_good", params: { pct: round(n.dm.protein) }, w: 12 * pf });
      if (pf < 0.5) negatives.push({ code: "protein_low", params: { pct: round(n.dm.protein) }, w: 12 * (1 - pf) });
      if (n.dm.fat > 30) negatives.push({ code: "fat_high", params: { pct: round(n.dm.fat) }, w: 6 * (1 - ff) });
      if (n.dm.fat < 5.5) negatives.push({ code: "fat_low", params: { pct: round(n.dm.fat) }, w: 4 });
      if (carbs >= 55) negatives.push({ code: "carbs_high", params: { pct: round(carbs) }, w: 4 * (1 - cf) });
      if (n.dm.fibre > 8) negatives.push({ code: "fibre_high", params: { pct: round(n.dm.fibre) }, w: 2 });
      if (n.dm.ash > 10.5) negatives.push({ code: "ash_high", params: { pct: round(n.dm.ash) }, w: 2 });
    }
    if (n.proteinPer1000kcal < ref.proteinPer1000 - 0.5) {
      negatives.push({ code: "protein_below_min", params: { g: round(n.proteinPer1000kcal), min: ref.proteinPer1000 }, w: 8 });
      a -= 3;
    }
    confidence = n.estimated.length === 0 ? "high" : n.estimated.length <= 2 ? "medium" : "low";
    if (n.estimated.length > 0) flags.push({ code: "values_estimated", severity: "info", params: { fields: n.estimated.join(",") } });
  }

  // ------------------------------------------------------------------ reasons for B / C
  const highP = cat ? 0.8 : 0.7;
  if (animalShare >= highP) positives.push({ code: "animal_protein_high", params: { pct: round(animalShare * 100) }, w: 12 * fP });
  else if (animalShare < (cat ? 0.55 : 0.4)) negatives.push({ code: "animal_protein_low", params: { pct: round(animalShare * 100) }, w: 12 * (1 - fP) });
  if (animalDmShare >= (cat ? 0.65 : 0.5)) positives.push({ code: "meat_rich", params: { pct: round(animalDmShare * 100) }, w: 12 * fM });
  else if (animalDmShare < (cat ? 0.35 : 0.2)) negatives.push({ code: "meat_poor", params: { pct: round(animalDmShare * 100) }, w: 12 * (1 - fM) });
  if (v0 >= 0.7) positives.push({ code: "first_named_animal", params: { name: lead[0].raw }, w: b2 });
  else if (lead[0] && !isAnimalProtein(lead[0].info.kind)) negatives.push({ code: "first_not_animal", params: { name: lead[0].raw }, w: 6.5 - b2 * 0.5 });
  if (animalP > 0 && namedShare >= 0.85) positives.push({ code: "named_sources", w: b3 });
  else if (animalP > 0 && namedShare < 0.4) negatives.push({ code: "generic_animal", w: 10 - b3 });
  if (vagueCount > 0) negatives.push({ code: "vague_plant", w: 1 });
  if (tagSet.has("omega3")) positives.push({ code: "omega3", w: 2 });
  if (tagSet.has("prebiotic")) positives.push({ code: "prebiotic", w: 1.5 });
  if (tagSet.has("joint")) positives.push({ code: "joint", w: 1 });
  if (tagSet.has("probiotic")) positives.push({ code: "probiotic", w: 1 });
  if (c >= 15) positives.push({ code: "clean_formulation", w: 3 });

  // ------------------------------------------------------------------ total
  const nutritionPillar = pillar(a, 35);
  const ingredientPillar = pillar(b1 + b2 + b3 + b4, 50);
  const formulationPillar = pillar(c, 15);
  let score = Math.round(nutritionPillar.points + ingredientPillar.points + formulationPillar.points);
  if (hazard) score = Math.min(score, 25);
  score = clamp(score, 0, 100);

  const rank = (arr: Weighted[]): Reason[] =>
    arr.sort((x, y) => y.w - x.w).map((r) => ({ code: r.code, ...(r.params ? { params: r.params } : {}) }));

  return {
    ...base,
    score,
    grade: hazard ? "E" : gradeFor(score),
    pillars: { nutrition: nutritionPillar, ingredients: ingredientPillar, formulation: formulationPillar },
    positives: rank(positives).slice(0, 6),
    negatives: rank(negatives).slice(0, 7),
    flags,
    confidence: ings.length < 3 ? "low" : confidence,
    animalProteinShare: animalShare,
    animalDmShare,
  };
}
