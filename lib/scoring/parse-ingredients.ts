import type { ParsedIngredient } from "./types";
import { classifyIngredient } from "./taxonomy";
import { normalize, parseLabelNumber } from "./text";

/** Words that start the additives section of a label; everything after is not "composition". */
const ADDITIVES_SPLIT =
  /\b(toevoegingsmiddelen|voedingsadditieven|additieven|technologische toevoegingsmiddelen|sensorische toevoegingsmiddelen|voedingsadditieven per kg|additives|zusatzstoffe|additifs)\b\s*[:.(]/i;

export interface SplitLabel {
  composition: string;
  additives: string;
}

/** An unclosed "(" would swallow the rest of the list into one ingredient, so unmatched ones are dropped. */
function dropUnmatchedBrackets(text: string): string {
  const chars = [...text];
  const open: number[] = [];
  const stray = new Set<number>();
  chars.forEach((ch, i) => {
    if (ch === "(") open.push(i);
    else if (ch === ")") {
      if (open.length) open.pop();
      else stray.add(i);
    }
  });
  for (const i of open) stray.add(i);
  return stray.size ? chars.map((ch, i) => (stray.has(i) ? " " : ch)).join("") : text;
}

/**
 * Scraped labels arrive with header junk ("Gewicht: 3 kg. Smaak: kip. ingredienten: ..."), "|" as
 * separator and "(bestaande uit) kip 3 %" phrasing. Normalise all of that into a plain list.
 */
export function prepareIngredientText(text: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  const header = [...t.matchAll(/(ingredi[eë]nten|samenstelling|composition|ingredients|zutaten)\s*:\s*/gi)].find(
    (m) => (m.index ?? 0) < 250,
  );
  if (header) t = t.slice((header.index ?? 0) + header[0].length);
  for (let i = 0; i < 4; i++) {
    t = t.replace(/^(gewicht|smaak|inhoud|verpakking|weight|flavou?r|geschmack|poids)\s*:[^.]*\.\s*/i, "");
  }
  // "(bestaande uit) kip 3 %, granen" -> "(kip 3 %), granen"
  t = t.replace(/\((?:bestaande uit|waaronder|waarvan|w\.o\.|onder andere|o\.a\.|bevat|inclusief)\)\s*([^,|;]*)/gi, "($1)");
  t = t.replace(/\s*[|•·]\s*/g, ", ");
  // some labels have no commas at all: "Kipfilet 67% Kippenbouillon 24% Ham 8%"
  if (!/[,;]/.test(t) && (t.match(/\d\s*%\s+(?=[A-Za-zÀ-ÿ])/g) ?? []).length >= 2) {
    t = t.replace(/(\d\s*%)\s+(?=[A-Za-zÀ-ÿ])/g, "$1, ");
  }
  return dropUnmatchedBrackets(t);
}

/**
 * Multipacks list one composition per flavour ("met Rund: Samenstelling: ... met Kip: Samenstelling: ...").
 * We score the first variant only. Trailing notes ("*stukjes: 44% ...") after the first full stop are dropped.
 */
function firstComposition(text: string): string {
  let t = text;
  const variant = t.search(/\.\s+(?:met|with|mit|avec)\s+[^:.]{2,45}:\s*(?:samenstelling|ingredi[eë]nten|composition)/i);
  if (variant > 0) t = t.slice(0, variant);
  const second = t.search(/(?:samenstelling|ingredi[eë]nten)\s*:/i);
  if (second > 40) t = t.slice(0, second);
  return t;
}

const NOTE_BREAK = /(?<!\b(?:vit|nr|bv|no))\.\s+(?=[*A-Za-z])/;

export function splitLabel(text: string): SplitLabel {
  const cleaned = firstComposition(prepareIngredientText(text));
  const m = cleaned.match(ADDITIVES_SPLIT);
  const head = m && m.index !== undefined ? cleaned.slice(0, m.index) : cleaned;
  const additives = m && m.index !== undefined ? cleaned.slice(m.index).trim() : "";
  const cut = head.search(NOTE_BREAK);
  return { composition: (cut > 20 ? head.slice(0, cut) : head).trim(), additives };
}

/** Split on commas that are not inside brackets. */
export function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const LEAD_JUNK = /^(samenstelling|ingredienten|ingredients|zutaten|composition|ingredienten)\s*[:\-]?\s*/i;

/** Separate the text outside brackets from the text inside them; nested brackets stay inside their parent. */
function splitBrackets(t: string): { outside: string; subs: string[] } {
  const subs: string[] = [];
  let outside = "";
  let cur = "";
  let depth = 0;
  for (const ch of t) {
    if (ch === "(" || ch === "[") {
      if (depth === 0) {
        outside += " ";
        cur = "";
      } else cur += ch;
      depth++;
    } else if ((ch === ")" || ch === "]") && depth > 0) {
      depth--;
      if (depth === 0) subs.push(cur);
      else cur += ch;
    } else if (depth > 0) cur += ch;
    else outside += ch;
  }
  if (depth > 0) subs.push(cur);
  return { outside, subs };
}

function parseToken(token: string): Omit<ParsedIngredient, "share"> | null {
  const t = token.replace(/\*+/g, "").replace(/[.\s]+$/g, "").replace(LEAD_JUNK, "").trim();
  if (!t) return null;

  // pull out bracket content
  const { outside, subs } = splitBrackets(t);
  const sub = subs.join(" ");

  // declared percentage outside brackets: "Kip 17%", "17% kip"
  let pct: number | undefined;
  const pm = outside.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
  if (pm) {
    const v = parseLabelNumber(pm[1]);
    if (v !== undefined && v > 0 && v <= 100) pct = v;
  }
  // "vlees en dierlijke bijproducten (14%, waarvan rund 4%)" - the leading figure in brackets is the share
  if (pct === undefined) {
    const lead = sub.match(/^\s*[>≥<≤~]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%/);
    if (lead) {
      const v = parseLabelNumber(lead[1]);
      if (v !== undefined && v > 0 && v <= 100) pct = v;
    }
  }
  const name = outside
    .replace(/(\d{1,3}(?:[.,]\d+)?)\s*%/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!name && !sub) return null;
  const info = classifyIngredient(name || sub, name ? sub : "");
  return { raw: (name || sub).replace(/^[-–\s]+/, ""), pct, info };
}

/**
 * Estimate each ingredient's share of the recipe.
 *
 * EU rules list ingredients in descending order of weight *as mixed* (fresh meat still
 * contains its water). Where a percentage is declared we use it; the remainder is spread
 * over the undeclared ingredients with a geometric decay, never exceeding the preceding
 * ingredient. Micronutrient lines at the tail get a small fixed share.
 * This is deliberately a rough model - it is used for *relative* shares only.
 */
export function estimateShares(tokens: Array<Omit<ParsedIngredient, "share">>): ParsedIngredient[] {
  const n = tokens.length;
  if (n === 0) return [];
  const isTail = (i: number) => ["mineral", "vitamin", "preservative", "colourant"].includes(tokens[i].info.kind);
  // tail = trailing run of additive-like lines
  let tailStart = n;
  while (tailStart > 0 && isTail(tailStart - 1)) tailStart--;
  const tailShare = 0.4;
  const tailTotal = Math.min(3, (n - tailStart) * tailShare);

  const declared = tokens.slice(0, tailStart).reduce((s, t) => s + (t.pct ?? 0), 0);
  const residual = Math.max(0, 100 - declared - tailTotal);
  const undeclaredIdx: number[] = [];
  for (let i = 0; i < tailStart; i++) if (tokens[i].pct === undefined) undeclaredIdx.push(i);
  const r = 0.72;
  const weights = undeclaredIdx.map((_, k) => r ** k);
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;

  const shares: number[] = new Array(n).fill(0);
  let prev = 100;
  let k = 0;
  for (let i = 0; i < tailStart; i++) {
    let s: number;
    if (tokens[i].pct !== undefined) s = tokens[i].pct as number;
    else {
      s = (residual * weights[k++]) / wSum;
      s = Math.min(s, prev);
    }
    shares[i] = s;
    prev = s;
  }
  for (let i = tailStart; i < n; i++) shares[i] = tailShare;

  const total = shares.reduce((a, b) => a + b, 0) || 1;
  return tokens.map((t, i) => ({ ...t, share: shares[i] / total }));
}

export function parseIngredients(text: string): { ingredients: ParsedIngredient[]; additivesText: string; compositionText: string } {
  const { composition, additives } = splitLabel(text);
  const tokens: Array<Omit<ParsedIngredient, "share">> = [];
  for (const part of splitTopLevel(composition)) {
    const tok = parseToken(part);
    if (tok) tokens.push(tok);
  }
  return { ingredients: estimateShares(tokens), additivesText: additives, compositionText: composition };
}

export { normalize };
