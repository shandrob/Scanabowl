import type { IndexEntry } from "../data/types";
import { lifeStageOf, type Stage } from "../pets/energy";
import { checkAllergies, type AllergenMatch, type AllergyVerdict } from "./allergens";
import type { PetProfile, Reason } from "./types";
import { clamp } from "./text";

/**
 * Personal fit of a product for one specific pet. The base Scanabowl Score (quality of the
 * food) never changes; this only adds a bounded adjustment [-20, +8] for things the base score
 * cannot know: life stage, weight goal, size, urinary/digestive needs.
 */

export interface Personal {
  allergy: AllergyVerdict;
  /** pet-specific score (0-100); null when the food has no base score */
  score: number | null;
  delta: number;
  notes: Array<Reason & { good: boolean }>;
  stage: Stage;
}

type Fit = Pick<IndexEntry, "n" | "t" | "l" | "sc" | "nu" | "pr" | "ad" | "ap"> & { ingredientsText?: string };

const SMALL_RE = /(x-?small|mini|small|toy|klein)/i;
const LARGE_RE = /(maxi|large|giant|grote|groot)/i;

export function personalFit(p: Fit, pet: PetProfile, now = new Date()): Personal {
  const stage = lifeStageOf(pet, now);
  const allergens: AllergenMatch = { definite: p.ad as AllergenMatch["definite"], possible: p.ap as AllergenMatch["possible"] };
  const allergy = checkAllergies(allergens, p.ingredientsText, pet);
  const notes: Personal["notes"] = [];
  let delta = 0;
  const add = (points: number, code: string, good: boolean, params?: Record<string, string | number>) => {
    delta += points;
    notes.push({ code, good, ...(params ? { params } : {}) });
  };

  // ---- life stage
  if (stage === "young") {
    if (p.l === "young") add(2, "stage_match", true);
    else if (p.l === "all") add(1, "stage_all", true);
    else add(-12, "stage_young_needed", false);
  } else if (stage === "senior") {
    if (p.l === "senior") add(2, "stage_match", true);
    else if (p.l === "young") add(-8, "stage_too_rich", false);
  } else if (p.l === "young") add(-8, "stage_too_rich", false);
  else if (p.l === "senior") add(-2, "stage_senior_only", false);

  // ---- weight management (fat share of energy)
  const fatEnergy = p.nu ? p.nu[2] : null;
  const weightRisk = pet.bodyCondition === "overweight" ? 1 : pet.neutered && pet.bodyCondition !== "underweight" ? 0.5 : 0;
  if (fatEnergy !== null && weightRisk > 0 && stage !== "young") {
    const hi = pet.species === "dog" ? 45 : 55;
    const mid = pet.species === "dog" ? 38 : 50;
    const lo = pet.species === "dog" ? 30 : 40;
    if (fatEnergy >= hi) add(Math.round(-6 * weightRisk), "weight_fat_high", false, { pct: fatEnergy });
    else if (fatEnergy >= mid) add(Math.round(-3 * weightRisk), "weight_fat_high", false, { pct: fatEnergy });
    else if (fatEnergy <= lo && pet.bodyCondition === "overweight") add(3, "weight_lean", true, { pct: fatEnergy });
  }
  if (pet.bodyCondition === "underweight" && p.nu && p.nu[1] >= 16) add(2, "energy_dense", true);

  // ---- size (kibble size and energy density) - dogs only
  if (pet.species === "dog" && pet.dogSize) {
    const small = SMALL_RE.test(p.n);
    const large = LARGE_RE.test(p.n);
    if ((pet.dogSize === "small" && small) || ((pet.dogSize === "large" || pet.dogSize === "giant") && large)) add(2, "size_match", true);
    else if ((pet.dogSize === "giant" || pet.dogSize === "large") && small) add(-3, "size_mismatch", false);
    else if (pet.dogSize === "small" && large) add(-3, "size_mismatch", false);
    // FEDIAF: late-growth calcium maximum 1.8 g/100 g DM - important for large and giant puppies
    if (stage === "young" && (pet.dogSize === "large" || pet.dogSize === "giant")) {
      const ca = p.nu ? p.nu[4] : 0;
      if (ca && ca > 1.8) add(-10, "calcium_large_puppy", false, { ca });
    }
  }

  // ---- cats: urinary tract
  if (pet.species === "cat" && pet.urinaryIssues) {
    if (p.t === "wet") add(6, "urinary_wet", true);
    else if (p.t === "dry") add(-4, "urinary_dry", false);
    if (p.nu && p.nu[3] > 9.5) add(-3, "urinary_ash", false, { pct: p.nu[3] });
  }

  // ---- sensitive digestion
  if (pet.sensitiveDigestion) {
    if (p.pr.length > 0 && p.pr.length <= 2) add(2, "digestion_simple", true);
    if (p.nu && p.nu[1] > (pet.species === "dog" ? 22 : 38)) add(-2, "digestion_fat", false);
  }

  delta = clamp(delta, -20, 8);
  const score = p.sc === null ? null : Math.round(clamp(p.sc + delta, 0, 100));
  return { allergy, score, delta, notes, stage };
}
