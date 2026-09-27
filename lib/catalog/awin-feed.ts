import { parse } from "csv-parse/sync";
import { normalizeEan } from "./clean";

/**
 * The zooplus product file ("product feed") from the Awin affiliate network.
 *
 * Awin's "Create-a-Feed" lets the publisher pick columns; these are Awin's standard column names. Only a few are
 * needed: product_name, brand_name, ean (or product_GTIN), merchant_deep_link (or aw_deep_link),
 * merchant_image_url (or aw_image_url), search_price, merchant_category / merchant_product_category_path and
 * description. Anything else is ignored, so a feed with more columns works too.
 */
export interface FeedItem {
  ean: string;
  name: string;
  brand: string;
  species: "Hond" | "Kat" | "";
  /** zooplus product page (or Awin tracking link when the feed only has that) */
  url: string;
  image: string;
  price?: number;
  category: string;
  ingredients: string;
  analysis: string;
}

/** Awin lets you choose the separator: comma, semicolon, pipe or tab. */
export function detectDelimiter(headerLine: string): string {
  const counts = [",", ";", "|", "\t"].map((d) => [d, headerLine.split(d).length - 1] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

export function parseFeed(text: string): Record<string, string>[] {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const header = body.split(/\r?\n/, 1)[0] ?? "";
  return parse(body, {
    columns: (h: string[]) => h.map((x) => x.trim().toLowerCase()),
    delimiter: detectDelimiter(header),
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];
}

const pick = (row: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) {
    const v = row[k.toLowerCase()];
    if (v !== undefined && String(v).trim()) return String(v).trim();
  }
  return "";
};

/** Label sections as zooplus writes them in the product description. */
const COMPOSITION = /(?:samenstelling|ingredi[eë]nten|composition|zusammensetzung)\s*:\s*/i;
const ANALYSIS = /(?:analytische bestanddelen|analytische componenten|analytical constituents|analytische bestandteile|constituants analytiques)\s*:\s*/i;
/** what follows the label data in a description */
const AFTER = /(?:voedingsadvies|voederadvies|voedingsaanbeveling|voeradvies|feeding (?:guide|recommendation)|fütterungsempfehlung|let op|tip:|bewaaradvies)\s*:?/i;

function stripHtml(s: string): string {
  return s
    .replace(/<\s*(br|\/p|\/li|\/h\d)\s*\/?>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .replace(/(\.\s*){2,}/g, ". ")
    .trim();
}

/** Pull "Samenstelling: ..." and "Analytische bestanddelen: ..." out of a product description. */
export function labelFromDescription(description: string): { ingredients: string; analysis: string } {
  const text = stripHtml(description);
  let ingredients = "";
  let analysis = "";
  const c = text.match(COMPOSITION);
  const a = text.match(ANALYSIS);
  if (c && c.index !== undefined) {
    const start = c.index + c[0].length;
    const ends = [a && a.index !== undefined && a.index > start ? a.index : -1, text.slice(start).search(AFTER) >= 0 ? start + text.slice(start).search(AFTER) : -1].filter((x) => x > start);
    ingredients = text.slice(start, ends.length ? Math.min(...ends) : undefined).trim();
  }
  if (a && a.index !== undefined) {
    const start = a.index + a[0].length;
    const rest = text.slice(start);
    const stop = [rest.search(COMPOSITION), rest.search(AFTER), rest.search(/(?:toevoegingsmiddelen|additieven|additives|zusatzstoffe)\s*[:(]/i)].filter((x) => x > 0);
    analysis = rest.slice(0, stop.length ? Math.min(...stop) : undefined).trim();
  }
  const tidy = (s: string) => s.replace(/[\s.;,]+$/, "").slice(0, 3000);
  return { ingredients: tidy(ingredients), analysis: tidy(analysis) };
}

const NOT_FOOD = /(snack|snoep|traktatie|kauw|speelgoed|toy|accessoire|kattenbak|kattengrit|strooisel|mand|bench|riem|halsband|tuig|verzorging|vlooien|teken|ontworm|shampoo|borstel|krabpaal|voerbak|drinkbak|fontein|kleding|transport|bed\b|supplement)/i;
const FOOD = /(hondenvoer|kattenvoer|droogvoer|natvoer|brokken|dieetvoer|diervoeding|kittenvoer|puppyvoer|vers vlees|diepvries|barf|dog food|cat food|hundefutter|katzenfutter)/i;

export function feedSpecies(text: string): FeedItem["species"] {
  const t = text.toLowerCase();
  const dog = /(hond|dog|hund|chien|puppy|pup\b)/.test(t);
  const cat = /(kat\b|katten|kitten|cat\b|cats\b|katze|chat\b)/.test(t);
  if (dog && !cat) return "Hond";
  if (cat && !dog) return "Kat";
  return "";
}

/** One feed row -> a food we can use, or null (not a dog or cat food, or no barcode). */
export function feedItem(row: Record<string, string>): FeedItem | null {
  const ean = normalizeEan(pick(row, "ean", "product_gtin", "gtin", "upc"));
  const name = pick(row, "product_name", "name", "title");
  if (!ean || !name) return null;
  const category = pick(row, "merchant_product_category_path", "merchant_category", "category_name", "product_type");
  const words = `${category} ${name}`;
  if (NOT_FOOD.test(category) || !FOOD.test(words)) return null;
  const species = feedSpecies(`${category} ${name}`);
  if (!species) return null;
  const description = [pick(row, "description"), pick(row, "product_short_description"), pick(row, "specifications")].filter(Boolean).join(". ");
  const { ingredients, analysis } = labelFromDescription(description);
  const priceText = pick(row, "search_price", "store_price", "display_price").replace(/[^\d.,]/g, "").replace(",", ".");
  const price = Number.parseFloat(priceText);
  return {
    ean,
    name,
    brand: pick(row, "brand_name", "brand"),
    species,
    url: pick(row, "merchant_deep_link", "aw_deep_link", "deep_link"),
    image: pick(row, "merchant_image_url", "large_image", "aw_image_url"),
    ...(Number.isFinite(price) && price > 0 && price < 1000 ? { price: Math.round(price * 100) / 100 } : {}),
    category,
    ingredients,
    analysis,
  };
}
