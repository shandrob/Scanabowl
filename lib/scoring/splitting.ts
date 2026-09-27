import { normalize } from "./text";

/**
 * "Ingredient splitting": one plant raw material listed in several forms (peas, pea protein, pea fibre).
 * Labels list ingredients by weight, so splitting lets each form sit lower on the list than the raw material would
 * as a whole. It is allowed and not always deliberate, but worth knowing: together the forms can outweigh what
 * leads the list. Information only - it does not change the score.
 */
export interface SplitGroup {
  /** the forms as printed on the label */
  forms: string[];
  /** estimated share of the recipe, percent */
  share: number;
  /** together more than the first ingredient */
  outweighsFirst: boolean;
}

interface SplitInput {
  raw: string;
  kind: string;
  /** estimated share of the recipe, percent */
  share: number;
}

const PLANT_KINDS = new Set(["cereal", "cereal_protein", "legume", "legume_protein", "tuber", "fibre", "veg_fruit", "other"]);

/** Longest first: "kikkererwt" before "erwt", "zoete aardappel" before "aardappel". */
const STEMS: Array<[string, RegExp]> = [
  ["chickpea", /(kikkererwt|chickpea|kichererbse|pois chiche)/],
  ["sweet potato", /(zoete aardappel|sweet potato|susskartoffel|patate douce)/],
  ["pea", /(erwt|(?<![a-z])peas?(?![a-z])|pea (?:protein|fib|starch|flour)|erbse|(?<![a-z])pois(?![a-z]))/],
  ["potato", /(aardappel|potato|kartoffel|pomme de terre)/],
  ["rice", /(rijst|(?<![a-z])rice|(?<![a-z])reis(?![a-z])|(?<![a-z])riz(?![a-z]))/],
  ["corn", /(mais|maize|(?<![a-z])corn)/],
  ["wheat", /(tarwe|wheat|weizen|(?<![a-z])ble(?![a-z]))/],
  ["lentil", /(linze|lentil|linse|lentille)/],
  ["soy", /(soja|(?<![a-z])soy)/],
  ["bean", /(bonen|(?<![a-z])boon|(?<![a-z])beans?(?![a-z])|bohne|feverole|faba)/],
  ["barley", /(gerst|barley|(?<![a-z])orge(?![a-z]))/],
  ["oat", /(haver|(?<![a-z])oats?(?![a-z])|hafer|avoine)/],
  ["tapioca", /(tapioca|cassave|cassava|maniok)/],
];

/** A processed part of a plant (pea protein, maize gluten, rice bran): the classic "split" next to the whole plant. */
const FRACTION = /(eiwit|protein|vezel|fib(?:er|re)|zetmeel|starch|meel|flour|gries|zemel|bran|gluten|kleie|staerke|starke|amidon|farine|(?<![a-z])son(?![a-z]))/;
/** Only worth a notice when the material is a real part of the recipe (estimated share, percent). */
export const SPLIT_MIN_SHARE = 20;

export function splitGroups(ingredients: SplitInput[]): SplitGroup[] {
  const firstShare = ingredients[0]?.share ?? 0;
  const groups = new Map<string, { forms: string[]; share: number }>();
  for (const i of ingredients) {
    if (!PLANT_KINDS.has(i.kind)) continue;
    const n = normalize(i.raw);
    const stem = STEMS.find(([, re]) => re.test(n))?.[0];
    if (!stem) continue;
    const g = groups.get(stem) ?? { forms: [], share: 0 };
    if (!g.forms.some((f) => normalize(f) === n)) g.forms.push(i.raw);
    g.share += i.share;
    groups.set(stem, g);
  }
  return [...groups.values()]
    // two varieties of lentils at a few percent is not splitting worth mentioning; peas + pea protein + pea starch
    // at a third of the recipe is
    .filter((g) => g.forms.length >= 2 && g.share >= SPLIT_MIN_SHARE && g.forms.some((f) => FRACTION.test(normalize(f))))
    .map((g) => ({ forms: g.forms, share: Math.round(g.share), outweighsFirst: ingredients.length > 1 && g.share > firstShare && !g.forms.includes(ingredients[0].raw) }))
    .sort((a, b) => b.share - a.share);
}
