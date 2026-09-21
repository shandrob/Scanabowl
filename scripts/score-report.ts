/** Calibration helper: scores the whole database and prints distributions + samples. */
import path from "node:path";
import fs from "node:fs";
import { readCsv } from "../lib/catalog/csv";
import { knownBrands } from "../lib/catalog/clean";
import { rowToProduct } from "../lib/catalog/records";
import { field } from "../lib/catalog/csv";
import { scoreProduct } from "../lib/scoring/score";

const ROOT = path.resolve(__dirname, "..");
const rows = readCsv(path.join(ROOT, "database/scraped/petsplace.csv"));
const kb = knownBrands(rows.map((r) => ({ name: field(r, "name"), brand: field(r, "brand") })));
const items = rows
  .map((r) => rowToProduct(r, { knownBrands: kb, defaultSource: "scraped", trustDeclared: true }))
  .filter((p): p is NonNullable<typeof p> => !!p)
  .map((p) => ({ p, r: scoreProduct(p) }));

const scored = items.filter((x) => x.r.score !== null);
console.log("products:", items.length, "scored:", scored.length, "notScored:", items.length - scored.length);
const bucket = (list: typeof scored) => {
  const b: Record<string, number> = {};
  for (const x of list) b[x.r.grade!] = (b[x.r.grade!] ?? 0) + 1;
  return b;
};
for (const sp of ["dog", "cat"] as const) {
  for (const ft of ["dry", "wet"] as const) {
    const list = scored.filter((x) => x.p.species === sp && x.p.foodType === ft);
    if (!list.length) continue;
    const s = list.map((x) => x.r.score!).sort((a, b) => a - b);
    const pct = (q: number) => s[Math.floor((s.length - 1) * q)];
    console.log(`${sp}/${ft}: n=${list.length} min=${s[0]} p10=${pct(0.1)} p25=${pct(0.25)} median=${pct(0.5)} p75=${pct(0.75)} p90=${pct(0.9)} max=${s[s.length - 1]} grades=${JSON.stringify(bucket(list))}`);
  }
}
const conf: Record<string, number> = {};
for (const x of scored) conf[x.r.confidence] = (conf[x.r.confidence] ?? 0) + 1;
console.log("confidence:", conf);
console.log("nutrition parsed:", scored.filter((x) => x.r.nutrition).length, "/", scored.length);
const notes: Record<string, number> = {};
for (const x of items) if (x.r.notScored) notes[x.r.notScored] = (notes[x.r.notScored] ?? 0) + 1;
console.log("notScored reasons:", notes);
const flagCount: Record<string, number> = {};
for (const x of scored) for (const f of x.r.flags) flagCount[f.code] = (flagCount[f.code] ?? 0) + 1;
console.log("flags:", flagCount);
const negCount: Record<string, number> = {};
for (const x of scored) for (const n of x.r.negatives) negCount[n.code] = (negCount[n.code] ?? 0) + 1;
console.log("negatives:", negCount);

const show = (label: string, list: typeof scored, n = 6) => {
  console.log(`\n== ${label}`);
  for (const x of list.slice(0, n))
    console.log(
      `${String(x.r.score).padStart(3)} ${x.r.grade} [${x.r.pillars!.nutrition.points}/${x.r.pillars!.ingredients.points}/${x.r.pillars!.formulation.points}] ${x.p.brand} | ${x.p.name.slice(0, 55)} (${x.p.species}/${x.p.foodType}) animal=${Math.round((x.r.animalProteinShare ?? 0) * 100)}% prot%DM=${x.r.nutrition ? Math.round(x.r.nutrition.dm.protein) : "-"} carb%ME=${x.r.nutrition ? Math.round(x.r.nutrition.energyShare.carbs) : "-"} conf=${x.r.confidence}`,
    );
};
const byScore = [...scored].sort((a, b) => b.r.score! - a.r.score!);
if (process.argv.includes("--samples")) {
  show("TOP dog", byScore.filter((x) => x.p.species === "dog"), 8);
  show("TOP cat", byScore.filter((x) => x.p.species === "cat"), 8);
  show("BOTTOM dog", [...byScore].reverse().filter((x) => x.p.species === "dog"), 8);
  show("BOTTOM cat", [...byScore].reverse().filter((x) => x.p.species === "cat"), 8);
  const pick = (re: RegExp) => scored.filter((x) => re.test(`${x.p.brand} ${x.p.name}`));
  show("Royal Canin", pick(/royal canin/i), 6);
  show("Whiskas/Felix/Pedigree", pick(/whiskas|felix|pedigree|chappi|sheba/i), 8);
  show("Orijen/Acana/Carnilove", pick(/orijen|acana|carnilove|applaws/i), 8);
  fs.writeFileSync(path.join(ROOT, "database/.score-sample.json"), JSON.stringify(byScore.slice(0, 3).map((x) => ({ p: x.p, r: x.r })), null, 1));
}

// pillar means per group
if (process.argv.includes("--pillars")) {
  for (const sp of ["dog", "cat"] as const) for (const ft of ["dry", "wet"] as const) {
    const list = scored.filter((x) => x.p.species === sp && x.p.foodType === ft);
    const m = (f: (x: (typeof list)[number]) => number) => (list.reduce((s, x) => s + f(x), 0) / list.length).toFixed(1);
    console.log(`${sp}/${ft} n=${list.length} nutrition=${m((x) => x.r.pillars!.nutrition.points)}/35 ingredients=${m((x) => x.r.pillars!.ingredients.points)}/50 formulation=${m((x) => x.r.pillars!.formulation.points)}/15 animalShare=${m((x) => (x.r.animalProteinShare ?? 0) * 100)}%`);
  }
  const mid = (re: RegExp) => scored.filter((x) => re.test(`${x.p.brand} ${x.p.name}`));
  for (const re of [/pedigree|chappi|frolic/i, /hill'?s.*(science|perfect)|hill's (canine|feline)/i, /pro plan/i, /eukanuba/i, /brit /i, /royal canin/i, /orijen|acana|carnilove|applaws|wellness/i]) {
    const list = mid(re); if (!list.length) continue;
    const s = list.map((x) => x.r.score!).sort((a, b) => a - b);
    console.log(String(re).padEnd(45), `n=${list.length}`, `median=${s[Math.floor(s.length / 2)]}`, `min=${s[0]} max=${s[s.length - 1]}`);
  }
}
