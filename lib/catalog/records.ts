import type { Category, FoodType, LifeStage, Species } from "../scoring/types";
import { parseAnalysis } from "../scoring/parse-analysis";
import {
  cleanName,
  eanFromUrl,
  extractPack,
  canonicalBrand,
  inferBrand,
  isJunkBrand,
  inferCategory,
  inferFoodType,
  isGarbageRow,
  mapFoodType,
  mapLifeStage,
  normalizeEan,
  simpleHash,
  slugify,
  toLifeStage,
  toSpecies,
} from "./clean";
import { field } from "./csv";

export type Source = "scraped" | "manual" | "brand" | "user";

export interface CatalogProduct {
  id: string;
  ean: string;
  slug: string;
  name: string;
  brand: string;
  species: Species;
  foodType: FoodType;
  lifeStage: LifeStage;
  category: Category;
  ingredients: string;
  analysis: string;
  pack: string;
  price?: number;
  bolUrl?: string;
  image?: string;
  imageCredit?: { source: string; license: string; url?: string };
  source: Source;
  sourceUrl?: string;
  notes?: string;
}

export const NL = {
  species: { dog: "Hond", cat: "Kat" },
  foodType: { dry: "Droogvoer", wet: "Natvoer", frozen: "Diepvriesvoer", "semi-moist": "Halfvochtig", other: "Overig" },
  lifeStage: { young: "Jong (puppy/kitten)", adult: "Volwassen", senior: "Senior", all: "Alle leeftijden" },
  category: { complete: "Volledig", complementary: "Aanvullend", veterinary: "Dieetvoer (dierenarts)", treat: "Snack", supplement: "Supplement" },
} as const;

/** Drop control characters that scrapers and Excel leave behind (keeps tab and newline). */
function stripControl(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 32 || c === 9 || c === 10) out += ch;
  }
  return out;
}

function looksLikeIngredients(t: string): boolean {
  if (!t) return false;
  if (/^(samenstelling|ingredi[eë]nten|ingredients|composition|zutaten)/i.test(t)) return true;
  const commas = (t.match(/,/g) ?? []).length;
  return commas >= 3 && !looksLikeAnalysis(t);
}

function looksLikeAnalysis(t: string): boolean {
  return /(eiwit|protein)/i.test(t) && /\d/.test(t) && /(vet|fat|as\b|celstof|vocht|fibre|ash|moisture)/i.test(t);
}

function parsePrice(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseFloat(raw.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 && n < 1000 ? n : undefined;
}

/** What the scraper writes when a page had no ingredient/analysis block. It is "no data", not a value. */
const PLACEHOLDER = /^(niet gevonden|not found|n\.?v\.?t\.?|onbekend|unknown|geen (?:informatie|gegevens)|(?:gewicht\s*:\s*)?\d+(?:[.,]\d+)?\s*(?:kg|g|gr|gram|ml|l)|[-–—.?]+)$/i;

function cleanText(input: string): string {
  const t = stripControl(input)
    .replace(/_x001F_/g, "")
    .replace(/\s+/g, " ")
    .replace(/(?:Product Details.*)$/i, "")
    .trim();
  return PLACEHOLDER.test(t) ? "" : t;
}

export interface RowContext {
  knownBrands: string[];
  defaultSource: Source;
  /**
   * true  = the row comes from the master database: values the owner typed are kept as-is.
   * false = raw scraper output: type and life stage are re-derived from name and analysis.
   */
  trustDeclared: boolean;
}

/** Turn any CSV row (master, scraper output, brand submission) into a clean product, or null if unusable. */
export function rowToProduct(row: Record<string, string>, ctx: RowContext): CatalogProduct | null {
  let ingredients = cleanText(field(row, "ingredients"));
  let analysisRaw = cleanText(field(row, "analysis"));
  // the scraper sometimes put the ingredient list in the analysis column and a pack size in the ingredients
  if (!looksLikeIngredients(ingredients) && looksLikeIngredients(analysisRaw)) {
    [ingredients, analysisRaw] = [analysisRaw, looksLikeAnalysis(ingredients) ? ingredients : ""];
  }
  const rawName = field(row, "name");
  if (isGarbageRow({ name: rawName, ingredients })) return null;

  const url = field(row, "url");
  const ean = normalizeEan(field(row, "ean")) || eanFromUrl(url);
  const declaredType = field(row, "foodType");
  const species = toSpecies(field(row, "species"), rawName);
  if (!species) return null;

  let analysis = analysisRaw;
  // the scraper sometimes stored cookie-banner text or an ingredient list in the analysis column
  if (/(cookies|social media|privacy|adverteren)/i.test(analysis) || (!/(eiwit|protein|vet|fat)/i.test(analysis) && /bijproducten/i.test(analysis))) {
    analysis = "";
  }
  const name = cleanName(rawName);
  const pack = field(row, "pack") || extractPack(rawName);
  const moisture = parseAnalysis(analysis).moisture;
  // a brand typed into the master database is trusted; scraper guesses are checked against the name
  const declaredBrand = field(row, "brand");
  const brand =
    ctx.trustDeclared && declaredBrand && !isJunkBrand(declaredBrand)
      ? canonicalBrand(declaredBrand)
      : inferBrand(rawName, declaredBrand, ctx.knownBrands);
  const category = inferCategory({
    name: rawName,
    brand,
    declaredType,
    declaredCategory: field(row, "category"),
    text: `${ingredients} ${analysis}`,
  });
  const foodType =
    (ctx.trustDeclared ? mapFoodType(declaredType) : undefined) ??
    inferFoodType({ name: rawName, declared: declaredType, moisture, pack });
  const lifeStage =
    (ctx.trustDeclared ? mapLifeStage(field(row, "lifeStage")) : undefined) ?? toLifeStage(field(row, "lifeStage"), rawName);

  const id = ean || `p-${simpleHash(`${brand}|${name}|${pack}`)}`;
  const slug = `${slugify(name.startsWith(brand) ? name : `${brand} ${name}`)}-${id}`.replace(/-+/g, "-");
  return {
    id,
    ean,
    slug,
    name,
    brand,
    species,
    foodType,
    lifeStage,
    category,
    ingredients,
    analysis,
    pack,
    price: parsePrice(field(row, "price")),
    bolUrl: field(row, "bolUrl") || undefined,
    image: field(row, "image") || undefined,
    source: ((): Source => {
      const s = field(row, "source").toLowerCase();
      if (s === "manual" || s === "brand" || s === "user" || s === "scraped") return s;
      return ctx.defaultSource;
    })(),
    sourceUrl: url || undefined,
    notes: field(row, "notes") || undefined,
  };
}

export function productToRow(p: CatalogProduct): Record<string, string | number | undefined> {
  return {
    ean: p.ean,
    naam: p.name,
    merk: p.brand,
    doeldier: NL.species[p.species],
    voertype: NL.foodType[p.foodType],
    levensfase: NL.lifeStage[p.lifeStage],
    categorie: NL.category[p.category],
    ingredienten: p.ingredients,
    analyse: p.analysis,
    verpakking: p.pack,
    prijs: p.price,
    bol_url: p.bolUrl,
    afbeelding: p.image,
    bron: p.source,
    url: p.sourceUrl,
    opmerking: p.notes,
  };
}
