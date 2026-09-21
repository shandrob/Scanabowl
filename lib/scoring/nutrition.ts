import type { Analysis, FoodType, Nutrition, Species } from "./types";
import { clamp } from "./text";

/**
 * Typical values used ONLY when the label leaves a value out. They are flagged in
 * Nutrition.estimated and lower the confidence of the score.
 */
const DEFAULTS: Record<FoodType, { moisture: number; ash: number; fibre: number }> = {
  dry: { moisture: 9, ash: 7.5, fibre: 2.5 },
  wet: { moisture: 78, ash: 2, fibre: 0.5 },
  frozen: { moisture: 68, ash: 3, fibre: 0.5 },
  "semi-moist": { moisture: 25, ash: 5, fibre: 1.5 },
  other: { moisture: 10, ash: 7, fibre: 2.5 },
};

/**
 * Metabolisable energy of a prepared pet food (kcal per 100 g), FEDIAF Nutritional
 * Guidelines 2021, Annex 7.2.2 (a) - the NRC 2006 predictive equations:
 *   GE  = 5.7*CP + 9.4*CF + 4.1*(NFE + CFib)               [kcal/100 g]
 *   digestibility(%) = 91.2 - 1.43*CFib_DM  (dog) | 87.9 - 0.88*CFib_DM (cat)
 *   ME  = GE * digestibility/100 - 1.04*CP (dog)  | - 0.77*CP (cat)
 */
export function estimateMePer100g(
  species: Species,
  m: { protein: number; fat: number; fibre: number; nfe: number; moisture: number },
): number {
  const ge = 5.7 * m.protein + 9.4 * m.fat + 4.1 * (m.nfe + m.fibre);
  const fibreDm = m.fibre / Math.max(0.05, 1 - m.moisture / 100);
  const digestibility = species === "dog" ? 91.2 - 1.43 * fibreDm : 87.9 - 0.88 * fibreDm;
  const de = (ge * clamp(digestibility, 50, 95)) / 100;
  return Math.max(0, de - (species === "dog" ? 1.04 : 0.77) * m.protein);
}

export function computeNutrition(species: Species, foodType: FoodType, a: Analysis): Nutrition | null {
  if (a.protein === undefined || a.fat === undefined) return null;
  const def = DEFAULTS[foodType];
  const estimated: Nutrition["estimated"] = [];
  const moisture = a.moisture ?? (estimated.push("moisture"), def.moisture);
  const ash = a.ash ?? (estimated.push("ash"), def.ash);
  const fibre = a.fibre ?? (estimated.push("fibre"), def.fibre);
  const protein = a.protein;
  const fat = a.fat;
  const nfe = Math.max(0, 100 - moisture - protein - fat - ash - fibre);
  const dmFactor = 100 / Math.max(5, 100 - moisture);
  const calc = estimateMePer100g(species, { protein, fat, fibre, nfe, moisture });
  const kcal = a.kcalPer100g ?? calc;
  const fatKcal = 8.5 * fat;
  const protKcal = 4 * protein;
  const carbKcal = 4 * nfe;
  const totalKcal = protKcal + fatKcal + carbKcal || 1;
  return {
    asFed: { protein, fat, fibre, ash, moisture, nfe },
    dm: {
      protein: protein * dmFactor,
      fat: fat * dmFactor,
      fibre: fibre * dmFactor,
      ash: ash * dmFactor,
      nfe: nfe * dmFactor,
      calcium: a.calcium !== undefined ? a.calcium * dmFactor : undefined,
      phosphorus: a.phosphorus !== undefined ? a.phosphorus * dmFactor : undefined,
    },
    kcalPer100g: kcal,
    kcalSource: a.kcalPer100g ? "label" : "calculated",
    proteinPer1000kcal: (protein / kcal) * 1000,
    fatPer1000kcal: (fat / kcal) * 1000,
    energyShare: {
      protein: (protKcal / totalKcal) * 100,
      fat: (fatKcal / totalKcal) * 100,
      carbs: (carbKcal / totalKcal) * 100,
    },
    estimated,
  };
}

/**
 * Minimum levels from the FEDIAF Nutritional Guidelines (October 2021), Tables III-3 and III-4,
 * expressed per 100 g dry matter and per 1000 kcal ME.
 *  - dog adult:  protein 21.0 g/100 g DM at 95 kcal/kg^0.75 (18.0 at 110), 45.0-52.1 g per 1000 kcal; fat 5.5 g/100 g DM
 *  - dog growth: protein 25.0 (early) / 20.0 (late) g/100 g DM; fat 8.5 g/100 g DM
 *  - cat adult:  protein 25.0 (at 100 kcal/kg^0.67) - 33.3 (at 75) g/100 g DM, 62.5-83.3 g/1000 kcal; fat 9.0 g/100 g DM
 *  - cat growth: protein 28-30 g/100 g DM; fat 9.0 g/100 g DM
 */
export const FEDIAF_MIN = {
  dog: {
    adult: { proteinDm: 18.0, proteinPer1000: 45.0, fatDm: 5.5, fatPer1000: 13.75 },
    young: { proteinDm: 20.0, proteinPer1000: 50.0, fatDm: 8.5, fatPer1000: 21.25 },
  },
  cat: {
    adult: { proteinDm: 25.0, proteinPer1000: 62.5, fatDm: 9.0, fatPer1000: 22.5 },
    young: { proteinDm: 28.0, proteinPer1000: 70.0, fatDm: 9.0, fatPer1000: 22.5 },
  },
} as const;

/** FEDIAF nutritional maximum for calcium in late-growth (large-breed) puppy food: 1.8 g/100 g DM. */
export const LARGE_BREED_PUPPY_CA_MAX_DM = 1.8;
