import { SPECIES, speciesIn } from "./taxonomy";
import { normalize } from "./text";

/**
 * Allergen groups a pet owner can pick in the pet profile.
 *
 * Evidence base for the selection and ordering (dogs: beef, dairy, chicken, wheat;
 * cats: beef, fish, chicken): Mueller RS, Olivry T, Prélaud P. Critically appraised
 * topic on adverse food reactions of companion animals (2): common food allergen
 * sources in dogs and cats. BMC Vet Res 2016;12:9.
 */
export const ALLERGEN_IDS = [
  "beef",
  "chicken",
  "dairy",
  "fish",
  "wheat",
  "egg",
  "lamb",
  "pork",
  "turkey",
  "duck",
  "rabbit",
  "horse",
  "game",
  "insect",
  "corn",
  "rice",
  "barley",
  "oats",
  "soy",
  "legume",
  "potato",
  "yeast",
] as const;
export type AllergenId = (typeof ALLERGEN_IDS)[number];

/** Most frequently reported first - drives the order of the chips in the pet profile. */
export const COMMON_ALLERGENS: Record<"dog" | "cat", AllergenId[]> = {
  dog: ["beef", "dairy", "chicken", "wheat", "egg", "lamb", "pork", "soy", "fish", "corn"],
  cat: ["beef", "fish", "chicken", "dairy", "egg", "wheat", "lamb", "pork", "turkey", "corn"],
};

const LAND_ANIMALS: AllergenId[] = ["chicken", "turkey", "duck", "beef", "lamb", "pork", "rabbit", "horse", "game"];
const CEREALS: AllergenId[] = ["wheat", "corn", "rice", "barley", "oats"];
const PLANTS: AllergenId[] = [...CEREALS, "soy", "legume", "potato"];

/** Maps a detected species id in the ingredient text to the allergen ids it *definitely* contains. */
const DEFINITE: Record<string, AllergenId[]> = {
  chicken: ["chicken"],
  turkey: ["turkey"],
  duck: ["duck"],
  goose: ["duck"], // closest cross-reactive group
  beef: ["beef"],
  lamb: ["lamb"],
  pork: ["pork"],
  horse: ["horse"],
  rabbit: ["rabbit"],
  game: ["game"],
  fish: ["fish"],
  egg: ["egg"],
  dairy: ["dairy"],
  insect: ["insect"],
  wheat: ["wheat"],
  corn: ["corn"],
  rice: ["rice"],
  barley: ["barley"],
  oats: ["oats"],
  rye: ["wheat"], // gluten-cereal cross reactivity
  soy: ["soy"],
  legume: ["legume"],
  potato: ["potato"],
  yeast: ["yeast"],
};

/** Vague label wording -> allergens that *could* be hidden in it. */
const POSSIBLE_RULES: Array<{ re: RegExp; ids: AllergenId[] }> = [
  // unspecified poultry could be chicken, turkey or duck
  { re: /(?<![a-z])(gevogelte|poultry|geflugel|volaille)/, ids: ["chicken", "turkey", "duck"] },
  // unspecified land-animal ingredients: EU category "meat and animal derivatives"
  {
    re: /(vlees en dierlijke|dierlijke (?:bij)?producten|dierlijke derivaten|dierlijke? (?:gehydrolyseerde )?eiwit|gehydrolyseerde dierlijke|meat and animal|animal (?:by-?products|derivatives|protein)|tierische (?:neben|eiwei)|sous-produits animaux|viandes? et sous|proteines? animales?|slachtafval|orgaanvlees|(?<![a-z])vlees(?![a-z])|(?<![a-z])meat(?![a-z])|(?<![a-z])fleisch(?![a-z])|(?<![a-z])viande(?![a-z])|gelatine|gelatin)/,
    ids: LAND_ANIMALS,
  },
  { re: /(?<![a-z])(granen|graan(?![a-z])|cereals?(?![a-z])|getreide|cereales)/, ids: CEREALS },
  { re: /(plantaardige (?:bij)?producten|plantaardige eiwit|vegetable (?:by-?products?|protein)|pflanzliche|sous-produits vegetaux|proteines vegetales)/, ids: PLANTS },
  { re: /(?<![a-z])gluten(?![a-z])/, ids: ["wheat", "barley", "oats"] },
];

export interface AllergenMatch {
  definite: AllergenId[];
  possible: AllergenId[];
}

export function detectAllergens(ingredientText: string): AllergenMatch {
  const t = normalize(ingredientText);
  const definite = new Set<AllergenId>();
  for (const id of speciesIn(t)) for (const a of DEFINITE[id] ?? []) definite.add(a);
  // poultry named generically: possible only (handled below), but do not mark chicken definite
  if (speciesIn(t).includes("poultry")) {
    // nothing definite - "gevogelte" is a group, not a species
  }
  const possible = new Set<AllergenId>();
  for (const rule of POSSIBLE_RULES) {
    if (rule.re.test(t)) for (const a of rule.ids) if (!definite.has(a)) possible.add(a);
  }
  return { definite: [...definite], possible: [...possible] };
}

/** Turn a free-text term ("kangaroo", "kalkoen") into allergen ids when it is a known word. */
export function resolveCustomAllergen(term: string): { ids: AllergenId[]; text: string } {
  const t = normalize(term);
  const ids = new Set<AllergenId>();
  for (const s of SPECIES) {
    if (s.re.test(t)) for (const a of DEFINITE[s.id] ?? []) ids.add(a);
  }
  return { ids: [...ids], text: t };
}

export interface AllergyVerdict {
  /** true = the product must be hidden for this pet */
  excluded: boolean;
  /** the pet's allergens that are definitely in the product */
  definite: string[];
  /** the pet's allergens that vague wording *might* hide */
  possible: string[];
}

/**
 * Decide whether a product is safe to show for a pet.
 * `productAllergens` are pre-computed at build time; `ingredientText` is only needed for
 * free-text (custom) allergens.
 */
export function checkAllergies(
  productAllergens: AllergenMatch,
  ingredientText: string | undefined,
  pet: { allergens: string[]; customAllergens: string[]; strictAllergies: boolean },
): AllergyVerdict {
  const wanted = new Set<string>(pet.allergens);
  const customText: string[] = [];
  for (const term of pet.customAllergens) {
    const { ids, text } = resolveCustomAllergen(term);
    ids.forEach((id) => wanted.add(id));
    if (text.length >= 3) customText.push(text);
  }
  const definite: string[] = productAllergens.definite.filter((a) => wanted.has(a));
  const possible: string[] = productAllergens.possible.filter((a) => wanted.has(a));
  if (ingredientText && customText.length) {
    const norm = normalize(ingredientText);
    for (const c of customText) if (norm.includes(c) && !definite.includes(c)) definite.push(c);
  }
  const excluded = definite.length > 0 || (pet.strictAllergies && possible.length > 0);
  return { excluded, definite, possible };
}
