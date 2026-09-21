import type { Category, FoodType, LifeStage, Species } from "../scoring/types";
import { normalize } from "../scoring/text";

/**
 * Cleaning / inference helpers shared by the legacy importer, the scraper output and
 * brand submissions. Pure functions - no I/O.
 */

/** Digits only; 12-digit UPC-A codes become EAN-13 by adding a leading zero. */
export function normalizeEan(raw: string | undefined | null): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 8) return d;
  if (d.length >= 12 && d.length <= 14) return d.padStart(13, "0").slice(-13);
  return "";
}

/** petsplace product URLs end in "...-<EAN>-pps". */
export function eanFromUrl(url: string | undefined): string {
  const m = (url ?? "").match(/-(\d{12,14})-pps/);
  return m ? normalizeEan(m[1]) : "";
}

export function slugify(input: string): string {
  return normalize(input)
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function simpleHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// ------------------------------------------------------------------ species

export function toSpecies(declared: string | undefined, name = ""): Species | null {
  const d = normalize(declared ?? "");
  if (/^(hond|dog|hund|chien)/.test(d)) return "dog";
  if (/^(kat|cat|katze|chat)/.test(d)) return "cat";
  const n = normalize(name);
  if (/(kattenvoer|kattenbrokken|kattendieet|katten|kitten|\bcat\b|\bkat\b|feline|katze|chat\b)/.test(n)) return "cat";
  if (/(hondenvoer|hondenbrokken|honden|puppy|\bdog\b|\bhond\b|canine|hund|chien)/.test(n)) return "dog";
  return null;
}

// ------------------------------------------------------------------ life stage

export function toLifeStage(declared: string | undefined, name = ""): LifeStage {
  const n = normalize(name);
  const d = normalize(declared ?? "");
  if (/(alle leeftijden|all life|all ages|toutes|alle lebens)/.test(n) || /(alle|all)/.test(d)) return "all";
  if (/(kitten|puppy|pup(?![a-z])|junior|growth|groei|starter|baby|welpe|chiot|chaton)/.test(n)) return "young";
  if (/(senior|mature|ageing|aging|\b(7|8|10|11|12|15)\+|vitalité 12|oud(?![a-z]))/.test(n)) return "senior";
  if (/(kitten|puppy|junior|jong|young)/.test(d)) return "young";
  if (/(senior|mature|oud)/.test(d)) return "senior";
  return "adult";
}

// ------------------------------------------------------------------ category

const VET_NAME_RE =
  /(veterinary|prescription diet|vet life|vetlife|dieetvoer|diet[ -]?food|veterinaire|\bvhn\b|trovet|farmina vet|specific (?:c[dn]|f[dh]|k[dc]|h[oz]|cx|ck|cdw|cs)|hill'?s (?:id|k\/d|c\/d|z\/d|w\/d|m\/d|i\/d|j\/d|t\/d|u\/d|r\/d|l\/d|a\/d)|purina pro plan veterinary|\bpvd\b)/;
const VET_CLINICAL_RE =
  /(gastro ?intestinal|renal(?![a-z])|urinary s\/o|hypoallergenic|hydrolyzed|hydrolysed|hepatic|diabetic|cardiac|satiety|anallergenic|sensitivity control|neutered satiety|fibre response|dermatosis|early cardiac)/;
const TREAT_RE =
  /(snack|treat|vleesworst|worstjes?|kluif|kluiven|runderoor|varkensoor|jerky|kauw|chew|koekje|koekjes|biscuit|beloning|sticks?(?![a-z])|botje|bone(?![a-z])|dentastix|catnip|kattenkruid|lekkerbotjes|trainer|\bmelk\b|kattenmelk|kittenmelk|puppymelk|pasta(?![a-z])|hairball paste|malt(?![a-z]))/;
const SUPPLEMENT_RE = /(supplement|vitamine|multivitamine|\bolie\b|omega|probiotic|kalk(?![a-z])|gewrichts|glucosamine|tabletten|druppels)/;

export function inferCategory(opts: {
  name: string;
  brand?: string;
  declaredType?: string;
  declaredCategory?: string;
  text?: string;
}): Category {
  const dc = normalize(opts.declaredCategory ?? "");
  if (dc) {
    if (/(dieet|vet|apotheek|veterinary)/.test(dc)) return "veterinary";
    if (/(snack|treat|lekker)/.test(dc)) return "treat";
    if (/(supplement)/.test(dc)) return "supplement";
    if (/(aanvullend|complement)/.test(dc)) return "complementary";
    if (/(volledig|complete|alleinfutter|complet)/.test(dc)) return "complete";
  }
  const name = normalize(`${opts.name} ${opts.brand ?? ""}`);
  const type = normalize(opts.declaredType ?? "");
  if (type.includes("apotheek")) return "veterinary";
  if (type.includes("snack")) return "treat";
  if (type.includes("supplement")) return "supplement";
  if (VET_NAME_RE.test(name)) return "veterinary";
  if (VET_CLINICAL_RE.test(name) && /(royal canin|hill|purina|pro plan|specific|virbac|farmina|eukanuba|iams|trovet)/.test(name)) return "veterinary";
  if (SUPPLEMENT_RE.test(name) && !/(voer|brokken|nat)/.test(name)) return "supplement";
  if (TREAT_RE.test(name) && !/(voer|brokken)/.test(name)) return "treat";
  if (/(aanvull(?:end|en)\b)/.test(name)) return "complementary";
  if (/(aanvullend (?:diervoeder|voer)|complementary (?:pet )?food|erganzungsfutter|aliment complementaire)/.test(normalize(opts.text ?? ""))) {
    return "complementary";
  }
  return "complete";
}

// ------------------------------------------------------------------ food type

const WET_NAME_RE = /(blik|pouch|zakje|maaltijdzakje|pate|mousse|gelei|jelly|in saus|gravy|filet|natvoer|nat voer|kuipje|schaaltje|\balu\b|worst|terrine|ragout|stukjes in|chunks in|maaltijdschaaltje|bouillon)/;

export function inferFoodType(opts: { name: string; declared?: string; moisture?: number; pack?: string }): FoodType {
  const d = normalize(opts.declared ?? "");
  if (typeof opts.moisture === "number") {
    if (d.includes("diepvries") || d.includes("frozen") || d.includes("raw")) return "frozen";
    if (opts.moisture >= 55) return "wet";
    if (opts.moisture <= 18) return "dry";
    return "semi-moist";
  }
  if (d.includes("diepvries") || d.includes("frozen") || d.includes("raw") || d.includes("rauw")) return "frozen";
  const n = normalize(opts.name);
  const pack = normalize(opts.pack ?? "");
  if (WET_NAME_RE.test(n)) return "wet";
  if (/\d+\s*x\s*\d+\s*g\b/.test(pack) || /\d+\s*x\s*\d+\s*g\b/.test(n)) return "wet";
  if (/(brokken|droogvoer|kibble|crunch|dry)/.test(n)) return "dry";
  if (/\bkg\b/.test(pack) || /\d\s*kg/.test(n)) return "dry";
  if (d.includes("nat") || d.includes("wet")) return "wet";
  if (d.includes("droog") || d.includes("dry")) return "dry";
  const grams = pack.match(/(\d+)\s*g\b/);
  if (grams && Number(grams[1]) <= 400) return "wet";
  return "dry";
}

/** Map an explicit value from the master file ("Natvoer", "wet", ...) to the enum, or undefined. */
export function mapFoodType(declared: string): FoodType | undefined {
  const d = normalize(declared);
  if (!d) return undefined;
  if (/(diepvries|frozen|raw|rauw|tiefkuhl|congel)/.test(d)) return "frozen";
  if (/(halfvochtig|semi)/.test(d)) return "semi-moist";
  if (/(nat|wet|nass|humide)/.test(d)) return "wet";
  if (/(droog|dry|trocken|sec)/.test(d)) return "dry";
  if (/(overig|other)/.test(d)) return "other";
  return undefined;
}

export function mapLifeStage(declared: string): LifeStage | undefined {
  const d = normalize(declared);
  if (!d) return undefined;
  if (/(alle|all)/.test(d)) return "all";
  if (/(jong|puppy|kitten|junior|young)/.test(d)) return "young";
  if (/(senior|oud|mature)/.test(d)) return "senior";
  if (/(volwassen|adult)/.test(d)) return "adult";
  return undefined;
}

// ------------------------------------------------------------------ name / pack / brand

const PACK_RE = /(\d+\s*x\s*)?\d+(?:[.,]\d+)?\s*(?:kg|g|gram)\b(?:\s*(?:bonuspack|multipack|voordeelverpakking))?/i;

export function extractPack(name: string): string {
  const m = name.match(PACK_RE);
  return m ? m[0].replace(/\s+/g, " ").trim() : "";
}

export function cleanName(name: string): string {
  const segs = name
    .replace(/\s+/g, " ")
    .split(/\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const kept = segs.filter((s) => {
    const n = normalize(s);
    if (/^(katten|honden|kat|hond)(voer|brokken|dieetvoer|snack|snacks|natvoer|droogvoer)?$/.test(n)) return false;
    if (/^(natvoer|droogvoer|kattendieetvoer|hondendieetvoer|diepvriesvoer)$/.test(n)) return false;
    if (/^pets ?place$/.test(n)) return false;
    return true;
  });
  const out = (kept.length ? kept : segs).join(" - ");
  return out.replace(/\s+-\s*$/, "").trim();
}

/** Brand fixes for scraper artefacts and sub-lines that belong to a parent brand. */
const BRAND_ALIASES: Array<[RegExp, string]> = [
  [/^royal canin veterinary( diets?)?$/i, "Royal Canin"],
  [/^hill'?s prescription diet$/i, "Hill's"],
  [/^pro plan veterinary( diets?)?$/i, "Pro Plan"],
  [/^purina pro plan$/i, "Pro Plan"],
  [/^wellness core$/i, "Wellness CORE"],
  [/^vitalstyle$/i, "VITALstyle"],
  [/^edgard ?& ?cooper$/i, "Edgard & Cooper"],
  [/^caro ?croc$/i, "CaroCroc"],
];
const JUNK_BRANDS = new Set(["en dogwash trimsalon", "productsubgroep secundaire", "familie", "onbekend", "natvoer", "droogvoer", ""]);

const GENERIC_FIRST_WORDS =
  /^(diepvriesvoer|puppyvoer|kattenvoer|hondenvoer|kittenvoer|gebitsverzorgende|natvoer|droogvoer|adult|senior|puppy|kitten|junior|mix|multipack|blik|brokken|graanvrij|light|mini|maxi|hondenbrokken|kattenbrokken)$/;

export function isJunkBrand(brand: string): boolean {
  return JUNK_BRANDS.has(normalize(brand));
}

export function canonicalBrand(brand: string): string {
  const b = brand.replace(/\s+/g, " ").trim();
  for (const [re, to] of BRAND_ALIASES) if (re.test(b)) return to;
  return b;
}

/**
 * Work out the brand. `known` = brands that occur as a prefix of at least two product names,
 * longest first. Falls back to the declared brand when it is plausible.
 */
export function inferBrand(name: string, declared: string, known: string[]): string {
  const n = normalize(name);
  for (const b of known) {
    const nb = normalize(b);
    if (n === nb || n.startsWith(nb + " ")) return canonicalBrand(b);
  }
  const d = declared.trim();
  if (d && !JUNK_BRANDS.has(normalize(d)) && n.includes(normalize(d).split(" ")[0])) return canonicalBrand(d);
  // last resort: first word(s) of the product name
  const first = name.split(/\s+/)[0] ?? "";
  if (GENERIC_FIRST_WORDS.test(normalize(first))) return "Overig";
  return first && first.length > 2 ? canonicalBrand(first) : canonicalBrand(d);
}

/** Build the list of brands that are safe to use as a name prefix. */
export function knownBrands(rows: Array<{ name: string; brand: string }>): string[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const b = r.brand.trim();
    if (!b || JUNK_BRANDS.has(normalize(b))) continue;
    if (normalize(r.name).startsWith(normalize(b) + " ") || normalize(r.name) === normalize(b)) {
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([b]) => b)
    .sort((a, b) => b.length - a.length);
}

export function isGarbageRow(row: { name: string; ingredients: string }): boolean {
  const n = normalize(row.name);
  if (n.length < 6) return true;
  if (/^(natvoer|droogvoer|kattenvoer|hondenvoer)$/.test(n)) return true;
  if (row.ingredients.length > 4000) return true; // scraped a whole page instead of the ingredients block
  return false;
}
