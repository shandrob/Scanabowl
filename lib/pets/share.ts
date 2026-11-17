import type { ActivityLevel, BodyCondition, DogSize, PetProfile, Species } from "../scoring/types";

const SPECIES = new Set<Species>(["dog", "cat"]);
const ACTIVITY = new Set<ActivityLevel>(["low", "moderate", "high"]);
const CONDITION = new Set<BodyCondition>(["underweight", "ideal", "overweight"]);
const SIZE = new Set<DogSize>(["small", "medium", "large", "giant"]);

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Compact JSON payload for sharing a pet profile across devices via URL (?pet=...). */
export function encodePetProfile(pet: PetProfile): string {
  const compact: Record<string, unknown> = {
    n: pet.name,
    sp: pet.species,
    w: pet.weightKg,
    ne: pet.neutered ? 1 : 0,
    ac: pet.activity,
    bc: pet.bodyCondition,
    st: pet.strictAllergies ? 1 : 0,
  };
  if (pet.birthDate) compact.bd = pet.birthDate;
  else if (pet.ageYears !== undefined) compact.ay = pet.ageYears;
  if (pet.dogSize) compact.ds = pet.dogSize;
  if (pet.allergens.length) compact.al = pet.allergens;
  if (pet.customAllergens.length) compact.ca = pet.customAllergens;
  if (pet.dislikes?.length) compact.dl = pet.dislikes;
  if (pet.urinaryIssues) compact.ur = 1;
  if (pet.sensitiveDigestion) compact.dg = 1;
  if (pet.preferredType) compact.pt = pet.preferredType;
  if (pet.reproduction) compact.rp = pet.reproduction;
  if (pet.wetGramsPerDay && pet.wetGramsPerDay > 0) compact.wg = pet.wetGramsPerDay;
  if (pet.currentFoodId) {
    compact.ci = pet.currentFoodId;
    if (pet.currentFoodName) compact.cn = pet.currentFoodName;
  }
  return toBase64Url(JSON.stringify(compact));
}

export function decodePetProfile(token: string, id: string): PetProfile | null {
  try {
    if (!token || token.length > 2000) return null;
    const raw = JSON.parse(fromBase64Url(token)) as Record<string, unknown>;
    if (!raw || typeof raw !== "object") return null;
    const name = typeof raw.n === "string" ? raw.n.trim().slice(0, 30) : "";
    const species = SPECIES.has(raw.sp as Species) ? (raw.sp as Species) : null;
    const weightKg = typeof raw.w === "number" && raw.w >= 0.5 && raw.w <= 100 ? raw.w : null;
    if (!name || !species || weightKg === null) return null;

    const strArr = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 30) : [];

    return {
      id,
      name,
      species,
      weightKg,
      neutered: raw.ne !== 0,
      activity: ACTIVITY.has(raw.ac as ActivityLevel) ? (raw.ac as ActivityLevel) : "moderate",
      bodyCondition: CONDITION.has(raw.bc as BodyCondition) ? (raw.bc as BodyCondition) : "ideal",
      dogSize: species === "dog" && SIZE.has(raw.ds as DogSize) ? (raw.ds as DogSize) : species === "dog" ? "medium" : undefined,
      birthDate: typeof raw.bd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.bd) ? raw.bd : undefined,
      ageYears: typeof raw.ay === "number" && raw.ay >= 0 && raw.ay <= 30 ? raw.ay : undefined,
      allergens: strArr(raw.al),
      customAllergens: strArr(raw.ca),
      dislikes: strArr(raw.dl),
      strictAllergies: raw.st !== 0,
      urinaryIssues: raw.ur === 1 || undefined,
      sensitiveDigestion: raw.dg === 1 || undefined,
      preferredType: raw.pt === "dry" || raw.pt === "wet" ? raw.pt : undefined,
      reproduction: raw.rp === "pregnant" || raw.rp === "nursing" ? raw.rp : undefined,
      wetGramsPerDay: typeof raw.wg === "number" && raw.wg > 0 && raw.wg <= 2000 ? raw.wg : undefined,
      currentFoodId: typeof raw.ci === "string" ? raw.ci : undefined,
      currentFoodName: typeof raw.cn === "string" ? raw.cn.slice(0, 120) : undefined,
    };
  } catch {
    return null;
  }
}
