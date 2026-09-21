import type { Analysis } from "./types";
import { normalize, parseLabelNumber } from "./text";

/**
 * Extracts the "analytical constituents" from the free text printed on the pack, e.g.
 *   "Ruw eiwit: 31,0% - Ruwe celstof: 2,7% - Ruw vet: 21,0% - Ruwe as: 6,5% ..."
 *   "ANALYTISCHE BESTANDDELEN: Eiwit 32,0%, Vetgehalte 10,4%, Ruwe as 5,4%"
 * All values are returned exactly as printed (% as fed).
 */

const NUM = String.raw`(\d{1,3}(?:[.,]\d+)?)`;
// up to 24 non-digit, non-letter-heavy characters between label and number
const GAP = String.raw`[^0-9a-z%]{0,3}(?:[a-z ()\-/]{0,24}?)[:=\s]*`;

function pick(t: string, labels: string): number | undefined {
  // "31,0%"  or, when the % sign is missing, a number closed by ; , or end of text ("Ruw eiwit: 5,9;")
  const re = new RegExp(`(?<![a-z])(?:${labels})(?![a-z]{4})${GAP}${NUM}(?:\\s*%|(?=\\s*(?:;|,|$)))`, "i");
  const m = t.match(re);
  if (!m) return undefined;
  const n = parseLabelNumber(m[1]);
  return n !== undefined && n >= 0 && n <= 100 ? n : undefined;
}

const LABELS = {
  protein: String.raw`ruwe? ?eiwit(?:gehalte)?|eiwit(?:gehalte)?|crude protein|protein|rohprotein|proteines? brutes?|proteine`,
  fat: String.raw`ruwe? ?vet(?:gehalte)?|vet(?:gehalte)?|crude fat|fat content|fat|rohfett|fett|matieres? grasses?(?: brutes?)?`,
  fibre: String.raw`ruwe? ?celstof|celstof|ruwe? ?vezels?|vezels?|crude fib(?:er|re)|fib(?:er|re)|rohfaser|cellulose brute`,
  ash: String.raw`ruwe? ?as|as(?=[: ]+\d)|crude ash|ash|rohasche|cendres brutes`,
  moisture: String.raw`vocht(?:gehalte)?|moisture|water|feuchtigkeit|humidite`,
  calcium: String.raw`calcium|kalzium`,
  phosphorus: String.raw`fosfor|phosphor(?:us)?|phosphore`,
  sodium: String.raw`natrium|sodium`,
  magnesium: String.raw`magnesium`,
  taurine: String.raw`taurine|taurin`,
};

export function parseAnalysis(text: string): Analysis {
  const out: Analysis = {};
  if (!text) return out;
  const t = normalize(text);
  for (const key of Object.keys(LABELS) as Array<keyof typeof LABELS>) {
    const v = pick(t, LABELS[key]);
    if (v !== undefined) out[key] = v;
  }

  // Energy: "4.216 kcal/kg", "375 kcal per 100 g", "ME 3750 kcal/kg"
  const e = t.match(/(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*kcal\s*(?:me)?\s*(?:\/|per|pro|par|-)?\s*(kg|100 ?g|g)?/);
  if (e) {
    const n = parseLabelNumber(e[1], { thousandsOk: true });
    const unit = e[2];
    if (n !== undefined) {
      let per100: number | undefined;
      if (unit === "kg") per100 = n / 10;
      else if (unit && unit.startsWith("100")) per100 = n;
      else if (unit === "g") per100 = n * 100;
      else per100 = n > 1000 ? n / 10 : undefined; // bare "3750 kcal" -> assume /kg
      if (per100 && per100 >= 40 && per100 <= 700) out.kcalPer100g = Math.round(per100);
    }
  }

  // Sanity: reject impossible combinations (scraper glue text etc.)
  const sum = (out.protein ?? 0) + (out.fat ?? 0) + (out.fibre ?? 0) + (out.ash ?? 0) + (out.moisture ?? 0);
  if (sum > 105) {
    return {};
  }
  if (out.protein !== undefined && out.protein > 80) delete out.protein;
  if (out.fat !== undefined && out.fat > 60) delete out.fat;
  return out;
}

/** How many of the five core values (protein, fat, fibre, ash, moisture) are printed. */
export function coreCount(a: Analysis): number {
  return [a.protein, a.fat, a.fibre, a.ash, a.moisture].filter((v) => v !== undefined).length;
}
