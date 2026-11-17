import { normalize } from "./scoring/text";

/**
 * Food search that forgives the way people actually type:
 *  - punctuation does not matter ("hills" finds Hill's, "edgard cooper" finds Edgard&Cooper);
 *  - product names are mostly Dutch, so the common words visitors type in English, German or French
 *    ("chicken", "Lachs", "saumon") also find "kip" and "zalm" - and the other way round;
 *  - British/American/Dutch spellings of "sterilised" all match;
 *  - a barcode finds its food.
 */

/** Words that mean the same thing on a pet food pack, in NL / EN / DE / FR (already normalised). */
const GROUPS: string[][] = [
  ["kip", "chicken", "huhn", "huhnchen", "hahnchen", "poulet"],
  ["gevogelte", "poultry", "geflugel", "volaille"],
  ["kalkoen", "turkey", "pute", "truthahn", "dinde"],
  ["eend", "duck", "ente", "canard"],
  ["rund", "beef", "rind", "boeuf"],
  ["lam", "lamb", "lamm", "agneau"],
  ["varken", "pork", "schwein", "porc"],
  ["konijn", "rabbit", "kaninchen", "lapin"],
  ["hert", "venison", "hirsch", "cerf"],
  ["paard", "horse", "pferd", "cheval"],
  ["vis", "fish", "fisch", "poisson"],
  ["zalm", "salmon", "lachs", "saumon"],
  ["tonijn", "tuna", "thunfisch", "thon"],
  ["haring", "herring", "hering", "hareng"],
  ["rijst", "rice", "reis", "riz"],
  ["graanvrij", "grainfree", "getreidefrei"],
  ["hond", "dog", "hund", "chien"],
  ["kat", "cat", "katze", "chat"],
  ["puppy", "welpe", "chiot"],
  ["kitten", "chaton"],
];

const SYNONYMS = new Map<string, string[]>();
for (const group of GROUPS) for (const word of group) SYNONYMS.set(word, group);

/** Normalise text for searching: lower case, no accents, no apostrophes, punctuation as spaces. */
export function searchNormalize(text: string): string {
  return normalize(text)
    .replace(/['’`´]/g, "")
    .replace(/[&+,.;:()!?"_-]/g, " ")
    .replace(/steriliz/g, "sterilis")
    .replace(/\s+/g, " ")
    .trim();
}

/** Each word of the query becomes a list of alternatives; a food matches when every word has a hit. */
export function queryTerms(query: string): string[][] {
  return searchNormalize(query)
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      if (w.startsWith("sterilis") || w.startsWith("gesterilis")) return ["sterili"];
      return SYNONYMS.get(w) ?? [w];
    });
}

function withinOneEdit(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  if (a === b) return true;
  if (la === lb) {
    let diff = 0;
    for (let i = 0; i < la; i++) {
      if (a[i] !== b[i]) {
        // adjacent transposition ("roaly" vs "royal")
        if (diff === 0 && i + 1 < la && a[i] === b[i + 1] && a[i + 1] === b[i]) {
          i++;
          diff++;
          continue;
        }
        diff++;
        if (diff > 1) return false;
      }
    }
    return diff === 1;
  }
  const [shorter, longer] = la < lb ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
    } else if (skipped) {
      return false;
    } else {
      skipped = true;
      j++;
    }
  }
  return true;
}

export function matchesQuery(haystack: string, terms: string[][]): boolean {
  let tokens: string[] | null = null;
  return terms.every((alternatives) => {
    if (alternatives.some((a) => haystack.includes(a))) return true;
    const fuzzyAlts = alternatives.filter((a) => a.length >= 4 && !/^\d+$/.test(a));
    if (!fuzzyAlts.length) return false;
    tokens ??= haystack.split(" ");
    return fuzzyAlts.some((a) => tokens!.some((tok) => withinOneEdit(a, tok)));
  });
}

/** The searchable text of a food: brand, name and barcode. */
export function searchHaystack(brand: string, name: string, ean: string): string {
  return searchNormalize(`${brand} ${name} ${ean}`);
}
