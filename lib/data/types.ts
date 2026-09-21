import type { AllergenMatch } from "../scoring/allergens";
import type { Category, Confidence, FoodType, Grade, LifeStage, Nutrition, Pillar, Reason, Flag, Species } from "../scoring/types";

/** One ingredient of the list, reduced to what the product page shows. */
export interface IngredientView {
  raw: string;
  kind: string;
  /** estimated share of the recipe in percent (1 decimal) */
  share: number;
  /** percentage declared on the pack */
  pct?: number;
  named: boolean;
}

/** Full record used by the product page (server side only). */
export interface ProductDetail {
  id: string;
  ean: string;
  slug: string;
  name: string;
  brand: string;
  species: Species;
  foodType: FoodType;
  lifeStage: LifeStage;
  category: Category;
  pack: string;
  price?: number;
  bolUrl?: string;
  image?: string;
  source: "scraped" | "manual" | "brand" | "user";
  ingredientsText: string;
  analysisText: string;
  score: number | null;
  grade: Grade | null;
  confidence: Confidence;
  notScored?: string;
  pillars: { nutrition: Pillar; ingredients: Pillar; formulation: Pillar } | null;
  positives: Reason[];
  negatives: Reason[];
  flags: Flag[];
  animalProteinShare: number | null;
  animalDmShare: number | null;
  grainFree: boolean;
  nutrition: Nutrition | null;
  ingredients: IngredientView[];
  allergens: AllergenMatch;
  /** species of animal protein sources named on the label, e.g. ["chicken","salmon"] */
  proteins: string[];
}

/**
 * Slim record shipped to the browser for the food finder (one file per species).
 * Short keys keep the JSON small: ~3000 products stay well under 300 KB gzipped.
 */
export interface IndexEntry {
  /** id */
  i: string;
  /** ean (may be empty) */
  e: string;
  /** slug */
  s: string;
  /** name */
  n: string;
  /** brand */
  b: string;
  /** food type */
  t: FoodType;
  /** life stage */
  l: LifeStage;
  /** category */
  c: Category;
  /** score (null = not scored) */
  sc: number | null;
  /** grade */
  g: Grade | null;
  /** grain free */
  gf: 0 | 1;
  /** has image */
  im: 0 | 1;
  /** definite allergens */
  ad: string[];
  /** possible allergens (vague label wording) */
  ap: string[];
  /** protein sources named on the label */
  pr: string[];
  /** kcal per 100 g as fed */
  k: number | null;
  /** pack description */
  pk: string;
  /** confidence */
  cf: Confidence;
  /** nutrition summary for personal matching: [protein % DM, fat % DM, fat % of energy, ash % DM, calcium % DM (0 = unknown)] */
  nu: [number, number, number, number, number] | null;
  /** price in euro if known */
  pc?: number;
}

export interface Meta {
  generatedAt: string;
  counts: { dog: number; cat: number; scoredDog: number; scoredCat: number };
  brands: { dog: string[]; cat: string[] };
}
