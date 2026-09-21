/**
 * One-time import of the pre-existing scraper files into the new master database.
 *
 *   npm run data:import-legacy
 *
 * Reads the four old CSV files in the parent folder, merges duplicates by EAN, repairs brands /
 * EANs / food types and writes database/scraped/petsplace.csv (the clean, editable format).
 * Refuses to overwrite an existing file unless you pass --force.
 */
import fs from "node:fs";
import path from "node:path";
import { field, MASTER_COLUMNS, readCsv, writeCsv } from "../lib/catalog/csv";
import { eanFromUrl, knownBrands, normalizeEan } from "../lib/catalog/clean";
import { productToRow, rowToProduct, type CatalogProduct } from "../lib/catalog/records";
import { normalize } from "../lib/scoring/text";

const ROOT = path.resolve(__dirname, "..");
const PARENT = path.resolve(ROOT, "..");
const SOURCES = [
  "products_import.csv",
  "Scanabowl Gemini App/petsplace_final_fixed_loop.csv",
  "Petfood database scraper/products_import.csv",
  "scanabowl_klaar.csv",
];

type Row = Record<string, string>;

function keyOf(row: Row): string {
  const ean = normalizeEan(field(row, "ean").replace(/^'/, "")) || eanFromUrl(field(row, "url"));
  if (ean) return `e:${ean}`;
  const url = field(row, "url");
  if (url) return `u:${url}`;
  return `n:${normalize(field(row, "name"))}`;
}

function score(row: Row): number {
  return field(row, "ingredients").length * 2 + field(row, "analysis").length + (field(row, "foodType") ? 50 : 0);
}

function merge(group: Row[]): Row {
  const sorted = [...group].sort((a, b) => score(b) - score(a));
  const out: Row = { ...sorted[0] };
  for (const other of sorted.slice(1)) {
    for (const [k, v] of Object.entries(other)) if (!String(out[k] ?? "").trim() && String(v ?? "").trim()) out[k] = v;
  }
  return out;
}

function main() {
  const target = path.join(ROOT, "database", "scraped", "petsplace.csv");
  if (fs.existsSync(target) && !process.argv.includes("--force")) {
    console.log("database/scraped/petsplace.csv already exists - not overwriting it (it may contain your edits).");
    console.log("Run with --force to rebuild it from the old files.");
    return;
  }
  const groups = new Map<string, Row[]>();
  let total = 0;
  for (const rel of SOURCES) {
    const file = path.join(PARENT, rel);
    if (!fs.existsSync(file)) {
      console.log(`skip (not found): ${rel}`);
      continue;
    }
    const rows = readCsv(file);
    total += rows.length;
    console.log(`read ${rows.length} rows from ${rel}`);
    for (const r of rows) {
      const k = keyOf(r);
      const list = groups.get(k) ?? [];
      list.push(r);
      groups.set(k, list);
    }
  }
  const merged = [...groups.values()].map(merge);
  const brandCtx = knownBrands(merged.map((r) => ({ name: field(r, "name"), brand: field(r, "brand") })));
  console.log(`unique keys: ${merged.length} (of ${total} rows); known brands: ${brandCtx.length}`);

  const products: CatalogProduct[] = [];
  let dropped = 0;
  for (const r of merged) {
    const p = rowToProduct(r, { knownBrands: brandCtx, defaultSource: "scraped", trustDeclared: false });
    if (p) products.push(p);
    else dropped++;
  }
  // a product can appear under two keys (EAN vs URL) - dedupe on id
  const byId = new Map<string, CatalogProduct>();
  for (const p of products) {
    const prev = byId.get(p.id);
    if (!prev || p.ingredients.length + p.analysis.length > prev.ingredients.length + prev.analysis.length) byId.set(p.id, p);
  }
  const list = [...byId.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));

  const outDir = path.join(ROOT, "database", "scraped");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "petsplace.csv");
  writeCsv(outFile, list.map(productToRow), MASTER_COLUMNS);
  console.log(`wrote ${list.length} products (dropped ${dropped} unusable rows) -> ${path.relative(ROOT, outFile)}`);

  // images that were already downloaded
  const imgDir = path.join(ROOT, "database", "images");
  fs.mkdirSync(imgDir, { recursive: true });
  let copied = 0;
  for (const rel of ["Petfood database scraper/scraped_images", "Scanabowl Gemini App/Afbeeldingen"]) {
    const dir = path.join(PARENT, rel);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(\d{8,14})\.(jpe?g|png|webp)$/i);
      if (!m) continue;
      const ean = normalizeEan(m[1]);
      if (!ean) continue;
      const dest = path.join(imgDir, `${ean}.${m[2].toLowerCase()}`);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(dir, f), dest);
        copied++;
      }
    }
  }
  console.log(`copied ${copied} product images -> database/images`);

  const bySpecies = { dog: 0, cat: 0 } as Record<string, number>;
  const byCat: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const p of list) {
    bySpecies[p.species]++;
    byCat[p.category] = (byCat[p.category] ?? 0) + 1;
    byType[p.foodType] = (byType[p.foodType] ?? 0) + 1;
  }
  console.log({ bySpecies, byCat, byType, withEan: list.filter((p) => p.ean).length, noIngredients: list.filter((p) => !p.ingredients).length });
}

main();
