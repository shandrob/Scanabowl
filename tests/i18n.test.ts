import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["nl", "en", "de", "fr"] as const;
type Json = string | Json[] | { [k: string]: Json };

const dict = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "messages", `${l}.json`), "utf8")) as Json])) as Record<(typeof LANGS)[number], Json>;

/** Flatten to "a.b.c" -> string (arrays get index paths). */
function flatten(v: Json, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof v === "string") out[prefix] = v;
  else if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${prefix}[${i}]`, out));
  else for (const [k, x] of Object.entries(v)) flatten(x, prefix ? `${prefix}.${k}` : k, out);
  return out;
}
const flat = Object.fromEntries(LANGS.map((l) => [l, flatten(dict[l])])) as Record<(typeof LANGS)[number], Record<string, string>>;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "tests"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("dictionaries", () => {
  it("have exactly the same keys in every language", () => {
    const base = Object.keys(flat.en).sort();
    for (const l of LANGS) {
      const keys = Object.keys(flat[l]).sort();
      expect(keys.filter((k) => !base.includes(k)), `${l}: extra keys`).toEqual([]);
      expect(base.filter((k) => !keys.includes(k)), `${l}: missing keys`).toEqual([]);
    }
  });

  it("use the same {placeholders} in every language", () => {
    for (const [key, en] of Object.entries(flat.en)) {
      for (const l of LANGS) {
        expect(placeholders(flat[l][key] ?? ""), `${l} ${key}`).toEqual(placeholders(en));
      }
    }
  });

  it("have no empty strings", () => {
    for (const l of LANGS) for (const [k, v] of Object.entries(flat[l])) expect(v.trim(), `${l} ${k}`).not.toBe("");
  });

  it("contain every key the code asks for", () => {
    const used = new Set<string>();
    for (const file of walk(ROOT)) {
      const src = fs.readFileSync(file, "utf8");
      for (const m of src.matchAll(/\b(?:t|raw)\(\s*"([A-Za-z0-9_.]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/\?\s*"([a-z]+\.[A-Za-z0-9_.]+)"\s*:\s*"([a-z]+\.[A-Za-z0-9_.]+)"/g)) [m[1], m[2]].forEach((k) => used.add(k));
      for (const m of src.matchAll(/key:\s*"([a-z]+\.[A-Za-z0-9_.]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/"(home\.pers[A-D])"/g)) used.add(m[1]);
    }
    const has = (k: string) => Object.keys(flat.en).some((f) => f === k || f.startsWith(`${k}.`) || f.startsWith(`${k}[`));
    const missing = [...used].filter((k) => !has(k));
    expect(missing).toEqual([]);
  });

  it("cover every dynamic key family", () => {
    const need: string[] = [];
    for (const g of ["A", "B", "C", "D", "E"]) need.push(`grade.${g}`, `grade.desc.${g}`);
    for (const c of ["high", "medium", "low"]) need.push(`confidence.${c}`);
    for (const s of ["dry", "wet", "frozen", "semi", "other"]) need.push(`type.${s}`);
    for (const s of ["adult", "senior", "all", "youngDog", "youngCat"]) need.push(`stage.${s}`);
    for (const s of ["young", "adult", "senior"]) need.push(`pet.stage.${s}`);
    for (const s of ["animal", "fat", "plant", "other"]) need.push(`product.group.${s}`);
    for (const s of ["veterinary", "treat", "supplement", "complementary", "no_ingredients", "ingredients_unclear"]) need.push(`product.notScored.${s}`);
    for (const s of ["nutrition", "ingredients", "formulation"]) need.push(`score.pillars.${s}`, `method.pillar.${s}`);
    for (const s of ["label", "calculated"]) need.push(`analysis.kcal.${s}`);
    for (const s of ["dog_adult", "dog_puppy", "cat_adult", "kitten"]) need.push(`personal.energyBasis.${s}`);
    for (const s of ["dog", "cat"]) need.push(`pet.activityLowHint.${s}`, `pet.activityModHint.${s}`, `pet.activityHighHint.${s}`);
    for (const s of ["required", "invalid"]) need.push(`forms.err.${s}`);
    const codes = fs.readFileSync(path.join(ROOT, "lib/scoring/score.ts"), "utf8");
    // every reason / flag code emitted by the scorer needs a text
    const reasonCodes = new Set<string>();
    for (const m of codes.matchAll(/code:\s*"([a-z0-9_]+)"/g)) reasonCodes.add(m[1]);
    for (const m of codes.matchAll(/deduct\([^,]+,\s*"([a-z_]+)"/g)) reasonCodes.add(m[1]);
    const flagCodes = new Set([...codes.matchAll(/\{\s*code:\s*"([a-z_]+)",\s*re:/g)].map((m) => m[1]));
    flagCodes.add("values_estimated");
    for (const c of reasonCodes) need.push(flagCodes.has(c) ? `flags.${c}` : `reasons.${c}`);
    const pers = fs.readFileSync(path.join(ROOT, "lib/scoring/personalize.ts"), "utf8");
    for (const m of pers.matchAll(/add\([^,]+,\s*"([a-z_]+)"/g)) need.push(`personal.notes.${m[1]}`);
    const allergens = fs.readFileSync(path.join(ROOT, "lib/scoring/allergens.ts"), "utf8");
    const list = allergens.match(/ALLERGEN_IDS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
    for (const m of list.matchAll(/"([a-z]+)"/g)) need.push(`allergen.${m[1]}`);
    const missing = need.filter((k) => !(k in flat.en));
    expect(missing).toEqual([]);
  });
});
