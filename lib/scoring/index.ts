export * from "./types";
export { scoreProduct, gradeFor, GRADE_LIMITS } from "./score";
export { ALLERGEN_IDS, COMMON_ALLERGENS, detectAllergens, checkAllergies, resolveCustomAllergen } from "./allergens";
export type { AllergenId, AllergenMatch, AllergyVerdict } from "./allergens";
