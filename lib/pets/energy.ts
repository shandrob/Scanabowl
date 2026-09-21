import type { PetProfile } from "../scoring/types";

/**
 * Life stage and daily energy of a pet.
 *
 * Energy follows the FEDIAF Nutritional Guidelines (2021), Annex 7.2.4:
 *  - dogs, Table VII-6/VII-7: 130 (1-2 y), 110 (3-7 y), 95 (>7 y) kcal ME/kg^0.75; 95 low, 110-125 moderate activity
 *  - puppies, Table VII-8a: (254.1 - 135.0 x BW/adult BW) x BW^0.75
 *  - cats, Table VII-9: 75 (52-75) kcal ME/kg^0.67 neutered/indoor, 100 active
 *  - kittens, Table VII-10: 2.0-2.5 x MER up to 4 months, 1.75-2.0 to 9 months, 1.5 to 12 months
 * These are starting points; FEDIAF itself stresses adjusting to the animal's body condition.
 */

export type Stage = "young" | "adult" | "senior";

const DAY = 24 * 3600 * 1000;

export function ageMonths(pet: Pick<PetProfile, "birthDate" | "ageYears">, now = new Date()): number | null {
  if (pet.birthDate) {
    const b = new Date(pet.birthDate);
    if (!Number.isNaN(b.getTime())) return Math.max(0, (now.getTime() - b.getTime()) / (30.44 * DAY));
  }
  if (typeof pet.ageYears === "number") return Math.max(0, pet.ageYears * 12);
  return null;
}

const ADULT_WEIGHT_BY_SIZE = { small: 7, medium: 18, large: 32, giant: 50 } as const;

export function expectedAdultWeight(pet: Pick<PetProfile, "species" | "dogSize" | "adultWeightKg">): number {
  if (pet.adultWeightKg && pet.adultWeightKg > 0) return pet.adultWeightKg;
  if (pet.species === "cat") return 4.3;
  return ADULT_WEIGHT_BY_SIZE[pet.dogSize ?? "medium"];
}

export function lifeStageOf(pet: Pick<PetProfile, "species" | "birthDate" | "ageYears" | "dogSize">, now = new Date()): Stage {
  const m = ageMonths(pet, now);
  if (m === null) return "adult";
  const youngUntil = pet.species === "cat" ? 12 : pet.dogSize === "giant" ? 24 : pet.dogSize === "large" ? 18 : 12;
  if (m < youngUntil) return "young";
  const years = m / 12;
  const seniorFrom = pet.species === "cat" ? 10 : { small: 9, medium: 8, large: 7, giant: 6 }[pet.dogSize ?? "medium"];
  return years >= seniorFrom ? "senior" : "adult";
}

export interface EnergyResult {
  /** kcal metabolisable energy per day */
  kcal: number;
  /** kcal per kg^0.75 (dogs) or kg^0.67 (cats) actually used */
  factor: number;
  stage: Stage;
  /** short code for the explanation shown to the owner */
  basis: "dog_adult" | "dog_puppy" | "cat_adult" | "kitten";
}

export function dailyEnergy(pet: PetProfile, now = new Date()): EnergyResult {
  const stage = lifeStageOf(pet, now);
  const w = Math.min(120, Math.max(0.3, pet.weightKg || 1));
  const months = ageMonths(pet, now) ?? 36;
  let kcal: number;
  let factor: number;
  let basis: EnergyResult["basis"];

  if (pet.species === "dog") {
    const w75 = w ** 0.75;
    if (stage === "young") {
      const p = Math.min(0.99, Math.max(0.05, w / expectedAdultWeight(pet)));
      factor = 254.1 - 135.0 * p;
      basis = "dog_puppy";
    } else {
      let base = pet.activity === "low" ? 95 : pet.activity === "high" ? 135 : 110;
      if (months < 24) base = Math.max(base, 125);
      if (stage === "senior") base *= 0.9;
      if (pet.neutered) base *= 0.93;
      factor = base;
      basis = "dog_adult";
    }
    kcal = factor * w75;
  } else {
    const w67 = w ** 0.67;
    const mer = pet.activity === "low" ? 65 : pet.activity === "high" ? 100 : pet.neutered ? 75 : 90;
    if (stage === "young") {
      const mult = months < 4 ? 2.25 : months < 9 ? 1.9 : 1.5;
      factor = 100 * mult;
      basis = "kitten";
    } else {
      factor = mer;
      basis = "cat_adult";
    }
    kcal = factor * w67;
  }
  // FEDIAF: start from a lower estimate and adjust to body condition
  if (stage !== "young") {
    if (pet.bodyCondition === "overweight") kcal *= 0.8;
    else if (pet.bodyCondition === "underweight") kcal *= 1.2;
  }
  return { kcal: Math.round(kcal), factor: Math.round(factor * 10) / 10, stage, basis };
}

/** Grams of a food per day for a given energy density (kcal per 100 g as fed). */
export function gramsPerDay(kcalPerDay: number, kcalPer100g: number): number {
  if (!kcalPer100g) return 0;
  return Math.round((kcalPerDay / kcalPer100g) * 100);
}

/** "12x85 g" -> 1020, "1.5 kg" -> 1500, "70 g" -> 70. */
export function packGrams(pack: string): number | null {
  const m = pack.toLowerCase().match(/(?:(\d+)\s*x\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g)\b/);
  if (!m) return null;
  const n = Number.parseFloat(m[2].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const grams = m[3] === "kg" ? n * 1000 : n;
  return Math.round(grams * (m[1] ? Number(m[1]) : 1));
}
