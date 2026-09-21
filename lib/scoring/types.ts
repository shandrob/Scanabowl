/**
 * Shared domain types for the Scanabowl scoring engine.
 * Everything in lib/scoring is pure (no I/O) so it runs identically at build time,
 * on the server and in the browser (for the personalised pet profile).
 */

export type Species = "dog" | "cat";
export type FoodType = "dry" | "wet" | "frozen" | "semi-moist" | "other";
/** young = puppy / kitten / junior, all = "all life stages" */
export type LifeStage = "young" | "adult" | "senior" | "all";
export type Category = "complete" | "complementary" | "veterinary" | "treat" | "supplement";
export type Confidence = "high" | "medium" | "low";
export type Grade = "A" | "B" | "C" | "D" | "E";

/** What kind of thing an ingredient is. Drives every score component. */
export type IngredientKind =
  | "meat" // named muscle meat / organs / poultry, fresh or dried (meal)
  | "fish"
  | "egg"
  | "dairy"
  | "generic_animal" // "meat and animal derivatives", "animal by-products", "meat"
  | "animal_extract" // hydrolysed / extracted / unspecified animal protein
  | "animal_fat"
  | "fish_oil"
  | "broth"
  | "insect"
  | "cereal"
  | "cereal_protein" // gluten meals, wheat/rice/corn protein
  | "legume"
  | "legume_protein" // pea/potato/soy protein isolates, "vegetable protein extracts"
  | "tuber"
  | "veg_fruit"
  | "fibre"
  | "plant_oil"
  | "yeast"
  | "botanical"
  | "binder"
  | "sugar"
  | "colourant"
  | "preservative"
  | "mineral"
  | "vitamin"
  | "other";

export type IngredientTag =
  | "omega3"
  | "prebiotic"
  | "probiotic"
  | "joint"
  | "taurine"
  | "natural_antioxidant"
  | "vague_plant"; // "cereals", "vegetable by-products" without detail

export interface IngredientInfo {
  kind: IngredientKind;
  /** approximate crude-protein fraction (0-1) of the ingredient *as listed* */
  protein: number;
  /** 1 = species named, 0.5 = group named (poultry, fish), 0 = unspecified */
  clarity: number;
  /** dry-matter fraction (0-1) of the ingredient as weighed in: fresh meat ~0.27, meal ~0.92 */
  dm: number;
  tags: IngredientTag[];
  /** human-readable canonical id, e.g. "chicken" */
  species?: string;
}

export interface ParsedIngredient {
  /** the label text as printed (original language) */
  raw: string;
  /** declared percentage, if any (0-100) */
  pct?: number;
  info: IngredientInfo;
  /** estimated share of the recipe as mixed (0-1), filled by estimateShares */
  share: number;
}

export interface Analysis {
  protein?: number;
  fat?: number;
  fibre?: number;
  ash?: number;
  moisture?: number;
  calcium?: number;
  phosphorus?: number;
  sodium?: number;
  magnesium?: number;
  taurine?: number;
  /** kcal ME per 100 g as printed on the label */
  kcalPer100g?: number;
}

export interface Nutrition {
  asFed: { protein: number; fat: number; fibre: number; ash: number; moisture: number; nfe: number };
  dm: { protein: number; fat: number; fibre: number; ash: number; nfe: number; calcium?: number; phosphorus?: number };
  kcalPer100g: number;
  kcalSource: "label" | "calculated";
  proteinPer1000kcal: number;
  fatPer1000kcal: number;
  /** % of metabolisable energy from protein / fat / carbohydrate */
  energyShare: { protein: number; fat: number; carbs: number };
  /** which values were filled with typical defaults because the label omits them */
  estimated: Array<"moisture" | "ash" | "fibre">;
}

export interface Reason {
  code: string;
  params?: Record<string, string | number>;
}

export type FlagSeverity = "hazard" | "concern" | "info";
export interface Flag extends Reason {
  severity: FlagSeverity;
}

export interface Pillar {
  points: number;
  max: number;
}

export interface ScoreResult {
  /** 0-100, integer. null when the product is not scored (see notScored) */
  score: number | null;
  grade: Grade | null;
  pillars: { nutrition: Pillar; ingredients: Pillar; formulation: Pillar } | null;
  positives: Reason[];
  negatives: Reason[];
  flags: Flag[];
  confidence: Confidence;
  notScored?: "veterinary" | "complementary" | "treat" | "supplement" | "no_ingredients";
  animalProteinShare: number | null;
  /** estimated share of the recipe's dry matter that is animal-derived (protein and fat) */
  animalDmShare: number | null;
  nutrition: Nutrition | null;
  /** ingredient list in order, with estimated shares */
  ingredients: ParsedIngredient[];
  /** true if no cereals appear in the ingredient list */
  grainFree: boolean;
}

export interface ProductInput {
  species: Species;
  foodType: FoodType;
  lifeStage: LifeStage;
  category: Category;
  ingredients: string;
  analysis: string;
  name?: string;
}

/** Pet profile as stored in the visitor's browser (never sent to a server). */
export type ActivityLevel = "low" | "moderate" | "high";
export type BodyCondition = "underweight" | "ideal" | "overweight";
export type DogSize = "small" | "medium" | "large" | "giant";

export interface PetProfile {
  id: string;
  name: string;
  species: Species;
  /** ISO date yyyy-mm-dd; used to derive the life stage */
  birthDate?: string;
  /** used when birthDate is unknown */
  ageYears?: number;
  weightKg: number;
  neutered: boolean;
  activity: ActivityLevel;
  bodyCondition: BodyCondition;
  dogSize?: DogSize;
  /** expected adult weight in kg (growing dogs); estimated from dogSize when empty */
  adultWeightKg?: number;
  /** allergen ids from ALLERGENS */
  allergens: string[];
  /** free text terms typed by the owner */
  customAllergens: string[];
  /** true = also hide products with vague ingredients that *could* contain the allergen */
  strictAllergies: boolean;
  urinaryIssues?: boolean;
  sensitiveDigestion?: boolean;
}
