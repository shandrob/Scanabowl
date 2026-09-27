import type { ProductDetail } from "../data/types";
import type { Species } from "../scoring/types";

/**
 * "Best food for ..." guides: automatic top lists, re-ranked on every deployment.
 * The ranking is the plain Scanabowl score - no brand can buy a place, and nothing is hand-picked.
 */
export interface GuideDef {
  slug: string;
  species: Species;
  /** which foods belong in the list (always on top of: complete food, scored, not low confidence) */
  match: (p: ProductDetail) => boolean;
  /** blog posts (folder names) that explain the topic further */
  posts: string[];
  /** finder filters for "see all" */
  finder: Record<string, string>;
  /** extra facts shown per food (besides protein, fat and energy) */
  facts?: Array<"calcium" | "moisture">;
}

export const LARGE_PUPPY_MAX_CALCIUM = 1.8;

const LARGE = /(large|maxi\b|giant|grote ?rassen|groot ras|grote honden|\bxl\b|big breed|grosse rassen|gro(?:ss|ß)e rassen)/i;
const SMALL = /(small|\bmini\b|kleine ?rassen|klein ras|kleine honden|\btoy\b|\bxs\b)/i;
const STERILISED = /(steril|castr|neutered|kastriert|gesteriliseerd|gecastreerd)/i;

const notYoung = (p: ProductDetail) => p.lifeStage !== "young";
const adultish = (p: ProductDetail) => p.lifeStage === "adult" || p.lifeStage === "all";
/** one named animal protein source, and no vague "meat and animal derivatives" that could hide another */
const singleProtein = (p: ProductDetail) => p.proteins.length === 1 && p.allergens.possible.length === 0;

export const GUIDES: GuideDef[] = [
  // ---------------------------------------------------------------- cats
  { slug: "kitten-food", species: "cat", facts: ["moisture"], match: (p) => p.lifeStage === "young", posts: ["2026-10-08-hoeveel-voer-per-dag"], finder: { stage: "young" } },
  { slug: "wet-cat-food", species: "cat", facts: ["moisture"], match: (p) => p.foodType === "wet" && adultish(p), posts: ["2026-09-28-natvoer-kat-water"], finder: { type: "wet" } },
  { slug: "dry-cat-food", species: "cat", facts: ["moisture"], match: (p) => p.foodType === "dry" && adultish(p), posts: ["2026-09-28-natvoer-kat-water"], finder: { type: "dry" } },
  { slug: "senior-cat-food", species: "cat", match: (p) => p.lifeStage === "senior", posts: ["2026-10-29-senior-hond-kat-voeding"], finder: { stage: "senior" } },
  { slug: "sterilised-cat-food", species: "cat", match: (p) => STERILISED.test(p.name) && notYoung(p), posts: ["2026-10-22-gesteriliseerde-kat-voeding"], finder: { q: "sterilised" } },
  { slug: "grain-free-cat-food", species: "cat", match: (p) => p.grainFree && notYoung(p), posts: ["2026-10-12-graanvrij-voer-beter"], finder: { gf: "1" } },
  { slug: "single-protein-cat-food", species: "cat", match: (p) => singleProtein(p) && notYoung(p), posts: ["2026-09-26-voedselallergie-herkennen"], finder: {} },
  // ---------------------------------------------------------------- dogs
  { slug: "puppy-food", species: "dog", match: (p) => p.lifeStage === "young", posts: ["2026-10-19-puppyvoer-groot-klein-ras"], finder: { stage: "young" } },
  // FEDIAF caps calcium for growing large-breed puppies at 1.8 g per 100 g dry matter: foods above it never make this list
  { slug: "large-breed-puppy-food", species: "dog", match: (p) => p.lifeStage === "young" && LARGE.test(p.name) && (p.nutrition?.dm.calcium ?? 0) <= LARGE_PUPPY_MAX_CALCIUM, facts: ["calcium"], posts: ["2026-10-19-puppyvoer-groot-klein-ras"], finder: { stage: "young", q: "large" } },
  { slug: "dry-dog-food", species: "dog", match: (p) => p.foodType === "dry" && adultish(p), posts: ["2026-09-21-etiket-lezen"], finder: { type: "dry" } },
  { slug: "wet-dog-food", species: "dog", match: (p) => p.foodType === "wet" && adultish(p), posts: ["2026-10-08-hoeveel-voer-per-dag"], finder: { type: "wet" } },
  { slug: "small-breed-dog-food", species: "dog", match: (p) => SMALL.test(p.name) && !LARGE.test(p.name) && notYoung(p), posts: ["2026-10-08-hoeveel-voer-per-dag"], finder: { q: "small" } },
  { slug: "large-breed-dog-food", species: "dog", match: (p) => LARGE.test(p.name) && notYoung(p), posts: ["2026-10-08-hoeveel-voer-per-dag"], finder: { q: "large" } },
  { slug: "senior-dog-food", species: "dog", match: (p) => p.lifeStage === "senior", posts: ["2026-10-29-senior-hond-kat-voeding"], finder: { stage: "senior" } },
  { slug: "grain-free-dog-food", species: "dog", match: (p) => p.grainFree && notYoung(p), posts: ["2026-10-12-graanvrij-voer-beter"], finder: { gf: "1" } },
  { slug: "single-protein-dog-food", species: "dog", match: (p) => singleProtein(p) && notYoung(p), posts: ["2026-09-26-voedselallergie-herkennen"], finder: {} },
];

export const GUIDE_SIZE = 10;
/** at most this many foods of one brand, so the list shows a real choice instead of one brand's range */
export const PER_BRAND = 2;

export function getGuideDef(slug: string): GuideDef | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Same recipe in another pack size: "Applaws Dog Adult - Kip 2 kg" and "... 15 kg". */
export function recipeKey(p: Pick<ProductDetail, "brand" | "name">): string {
  return `${p.brand}|${p.name}`
    .toLowerCase()
    .replace(/(\d+\s*x\s*)?\d+(?:[.,]\d+)?\s*(kg|g|gr|gram|ml|l)\b/g, " ")
    .replace(/\b(promo|bonuspack|multipack|voordeelverpakking|gratis|extra)\b/g, " ")
    .replace(/[^a-z0-9à-ÿ]+/g, " ")
    .trim();
}

/** Foods that may appear in any guide at all. */
export function eligible(p: ProductDetail): boolean {
  return p.category === "complete" && p.score !== null && p.confidence !== "low";
}

export interface GuideResult {
  top: ProductDetail[];
  /** all foods that matched the guide, before de-duplication */
  candidates: number;
  brands: number;
}

/** Rank one guide: best score first, one pack size per recipe, at most PER_BRAND foods per brand. */
export function rankGuide(def: GuideDef, foods: ProductDetail[], size = GUIDE_SIZE): GuideResult {
  const list = foods
    .filter((p) => p.species === def.species && eligible(p) && def.match(p))
    // ties: the food with a photo and the most complete label first, then alphabetical - stable across builds
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || Number(!!b.image) - Number(!!a.image) || (b.confidence === "high" ? 1 : 0) - (a.confidence === "high" ? 1 : 0) || a.name.localeCompare(b.name));
  const seen = new Set<string>();
  const perBrand = new Map<string, number>();
  const top: ProductDetail[] = [];
  for (const p of list) {
    const key = recipeKey(p);
    // shops also name one recipe in two ways ("Acana Puppy Large Breed - 11.4 kg" / "... - Kip Kalkoen 17 kg"):
    // same brand, same score and the same numbers on the label is the same food
    const nu = p.nutrition;
    const twin = nu ? `${p.brand}|${p.score}|${Math.round(nu.kcalPer100g)}|${Math.round(nu.dm.protein)}|${Math.round(nu.dm.fat)}` : "";
    if (seen.has(key) || (twin && seen.has(twin))) continue;
    if (twin) seen.add(twin);
    const n = perBrand.get(p.brand) ?? 0;
    if (n >= PER_BRAND) continue;
    seen.add(key);
    perBrand.set(p.brand, n + 1);
    top.push(p);
    if (top.length === size) break;
  }
  return { top, candidates: list.length, brands: new Set(list.map((p) => p.brand)).size };
}

/** Guides a food appears in (for links from the food page). */
export function guidesFor(p: ProductDetail): GuideDef[] {
  if (!eligible(p)) return [];
  return GUIDES.filter((g) => g.species === p.species && g.match(p));
}
