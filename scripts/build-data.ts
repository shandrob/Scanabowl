/**
 * Build the website data from the master database.
 *
 *   npm run data:build
 *
 * Reads   database/scraped/*.csv, database/manual/*.csv, database/overrides.csv
 * Writes  data/generated/products.{dog,cat}.json   full records (product pages)
 *         data/generated/slugs.json                slug -> species (routing, sitemap)
 *         public/data/index.{dog,cat}.json          slim records (food finder, barcode lookup)
 *         data/generated/meta.json                  counts + brand lists
 *         public/products/<ean>.webp                optimised product photos
 *         database/build-report.txt                 problems you may want to fix in the database
 *
 * This runs automatically before every `npm run build`, i.e. on every deploy.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { field, readCsv } from "../lib/catalog/csv";
import { knownBrands, normalizeEan } from "../lib/catalog/clean";
import { rowToProduct, type CatalogProduct, type RowContext, type Source } from "../lib/catalog/records";
import { detectAllergens } from "../lib/scoring/allergens";
import { scoreProduct } from "../lib/scoring/score";
import { speciesIn } from "../lib/scoring/taxonomy";
import { detailToIndex } from "../lib/data/index-entry";
import type { IndexEntry, IngredientView, Meta, ProductDetail } from "../lib/data/types";
import type { Species } from "../lib/scoring/types";

const ROOT = path.resolve(__dirname, "..");
const DB = path.join(ROOT, "database");
const OUT = path.join(ROOT, "data", "generated");
const PUB = path.join(ROOT, "public");

type Row = Record<string, string>;

function csvFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".csv") && !f.startsWith("_") && !f.startsWith("~"))
    .map((f) => path.join(dir, f));
}

async function main() {
  const started = Date.now();
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(PUB, "data"), { recursive: true });
  fs.mkdirSync(path.join(PUB, "products"), { recursive: true });

  // ---------------------------------------------------------------- read
  const raw: Array<{ row: Row; source: Source; file: string }> = [];
  for (const [folder, source] of [
    ["scraped", "scraped"],
    ["manual", "manual"],
  ] as const) {
    for (const file of csvFiles(path.join(DB, folder))) {
      const rows = readCsv(file);
      for (const row of rows) raw.push({ row, source, file: path.relative(DB, file) });
    }
  }
  const overridesFile = path.join(DB, "overrides.csv");
  const overrides = new Map<string, Row>();
  if (fs.existsSync(overridesFile)) {
    for (const r of readCsv(overridesFile)) {
      const ean = normalizeEan(field(r, "ean"));
      if (ean) overrides.set(ean, r);
    }
  }
  const brandList = knownBrands(raw.map(({ row }) => ({ name: field(row, "name"), brand: field(row, "brand") })));

  // ---------------------------------------------------------------- clean + merge
  const report: string[] = [];
  const byId = new Map<string, CatalogProduct>();
  let unusable = 0;
  for (const { row, source, file } of raw) {
    let r = row;
    const ean = normalizeEan(field(row, "ean"));
    const ov = ean ? overrides.get(ean) : undefined;
    if (ov) {
      r = { ...row };
      for (const [k, v] of Object.entries(ov)) if (k !== "ean" && String(v ?? "").trim()) r[k] = v;
    }
    const ctx: RowContext = { knownBrands: brandList, defaultSource: source, trustDeclared: true };
    const p = rowToProduct(r, ctx);
    if (!p) {
      unusable++;
      continue;
    }
    const prev = byId.get(p.id);
    // manual / brand / user rows always win over scraped ones; otherwise keep the richer row
    const rank = (x: CatalogProduct) => (x.source === "scraped" ? 0 : 1);
    if (!prev || rank(p) > rank(prev) || (rank(p) === rank(prev) && p.ingredients.length + p.analysis.length > prev.ingredients.length + prev.analysis.length)) {
      byId.set(p.id, p);
    }
    void file;
  }

  // unique slugs
  const slugs = new Set<string>();
  const products = [...byId.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
  for (const p of products) {
    let s = p.slug;
    let n = 2;
    while (slugs.has(s)) s = `${p.slug}-${n++}`;
    p.slug = s;
    slugs.add(s);
  }

  // ---------------------------------------------------------------- images
  const imgSrc = path.join(DB, "images");
  const imgFiles = new Map<string, string>();
  if (fs.existsSync(imgSrc)) {
    for (const f of fs.readdirSync(imgSrc)) {
      const m = f.match(/^(\d{8,14})\.(jpe?g|png|webp)$/i);
      if (m) imgFiles.set(normalizeEan(m[1]), path.join(imgSrc, f));
    }
  }
  // database/image-credits.csv: photos from openly licensed sources (filled by tools/fetch_opff_images.py)
  const credits = new Map<string, { source: string; license: string; url?: string }>();
  const creditsFile = path.join(DB, "image-credits.csv");
  if (fs.existsSync(creditsFile)) {
    for (const r of readCsv(creditsFile)) {
      const ean = normalizeEan(r.ean ?? "");
      const source = (r.bron ?? r.source ?? "").trim();
      if (ean && source) credits.set(ean, { source, license: (r.licentie ?? r.license ?? "").trim(), ...(r.url ? { url: r.url.trim() } : {}) });
    }
  }
  let imagesDone = 0;
  for (const p of products) {
    const src = p.ean ? imgFiles.get(p.ean) : undefined;
    if (!src) continue;
    const dest = path.join(PUB, "products", `${p.ean}.webp`);
    const stale = !fs.existsSync(dest) || fs.statSync(dest).mtimeMs < fs.statSync(src).mtimeMs;
    if (stale) {
      try {
        await sharp(src).rotate().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
        imagesDone++;
      } catch (e) {
        report.push(`IMAGE  ${p.ean}: could not convert (${(e as Error).message})`);
        continue;
      }
    }
    p.image = `/products/${p.ean}.webp`;
    const credit = credits.get(p.ean);
    if (credit) p.imageCredit = credit;
  }

  // ---------------------------------------------------------------- blog images
  // content/blog/<slug>/*.png|jpg -> public/blog-images/<slug>/*.webp (max 1600 px wide)
  const blogDir = path.join(ROOT, "content", "blog");
  let blogImages = 0;
  if (fs.existsSync(blogDir)) {
    for (const d of fs.readdirSync(blogDir, { withFileTypes: true })) {
      if (!d.isDirectory() || d.name.startsWith("_") || d.name.startsWith(".")) continue;
      for (const f of fs.readdirSync(path.join(blogDir, d.name))) {
        const m = f.match(/^(.+)\.(png|jpe?g|webp)$/i);
        if (!m) continue;
        const src = path.join(blogDir, d.name, f);
        const destDir = path.join(PUB, "blog-images", d.name);
        const dest = path.join(destDir, `${m[1]}.webp`);
        if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) continue;
        fs.mkdirSync(destDir, { recursive: true });
        try {
          await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
          blogImages++;
        } catch (e) {
          report.push(`BLOG IMAGE ${d.name}/${f}: ${(e as Error).message}`);
        }
      }
    }
  }

  // ---------------------------------------------------------------- score
  const details: Record<Species, ProductDetail[]> = { dog: [], cat: [] };
  const index: Record<Species, IndexEntry[]> = { dog: [], cat: [] };
  const slugMap: Record<string, Species> = {};
  const problems = { noIngredients: [] as string[], noAnalysis: [] as string[], suspicious: [] as string[], lowConfidence: 0, hazards: [] as string[] };

  for (const p of products) {
    const result = scoreProduct(p);
    const allergens = detectAllergens(p.ingredients);
    const proteins = [
      ...new Set(
        result.ingredients
          .filter((i) => ["meat", "fish", "egg", "insect", "animal_extract", "generic_animal"].includes(i.info.kind))
          .flatMap((i) => (i.info.species ? [i.info.species] : speciesIn(i.raw)))
          .filter((s) => !["dairy", "egg"].includes(s) || s === "egg"),
      ),
    ].slice(0, 6);
    const ingredients: IngredientView[] = result.ingredients.map((i) => ({
      raw: i.raw,
      kind: i.info.kind,
      share: Math.round(i.share * 1000) / 10,
      ...(i.pct !== undefined ? { pct: i.pct } : {}),
      named: i.info.clarity >= 0.5,
    }));
    const n = result.nutrition;
    const detail: ProductDetail = {
      id: p.id,
      ean: p.ean,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      species: p.species,
      foodType: p.foodType,
      lifeStage: p.lifeStage,
      category: p.category,
      pack: p.pack,
      ...(p.price ? { price: p.price } : {}),
      ...(p.bolUrl ? { bolUrl: p.bolUrl } : {}),
      ...(p.image ? { image: p.image } : {}),
      ...(p.image && p.imageCredit ? { imageCredit: p.imageCredit } : {}),
      source: p.source,
      ingredientsText: p.ingredients,
      analysisText: p.analysis,
      score: result.score,
      grade: result.grade,
      confidence: result.confidence,
      ...(result.notScored ? { notScored: result.notScored } : {}),
      pillars: result.pillars,
      positives: result.positives,
      negatives: result.negatives,
      flags: result.flags,
      animalProteinShare: result.animalProteinShare === null ? null : Math.round(result.animalProteinShare * 1000) / 1000,
      animalDmShare: result.animalDmShare === null ? null : Math.round(result.animalDmShare * 1000) / 1000,
      grainFree: result.grainFree,
      nutrition: n,
      ingredients,
      allergens,
      proteins,
    };
    details[p.species].push(detail);
    slugMap[p.slug] = p.species;
    index[p.species].push(detailToIndex(detail));

    // ---- data-quality report
    const label = `${p.ean || p.id} | ${p.brand} | ${p.name}`;
    if (p.category === "complete") {
      if (!p.ingredients) problems.noIngredients.push(label);
      else if (!p.analysis) problems.noAnalysis.push(label);
      if (result.score !== null && (result.animalProteinShare ?? 0) === 0 && result.ingredients.length > 0) problems.suspicious.push(`${label}  (no animal ingredient recognised: check the ingredient text)`);
      if (result.confidence === "low") problems.lowConfidence++;
      if (result.flags.some((f) => f.severity === "hazard")) problems.hazards.push(`${label}  -> ${result.flags.filter((f) => f.severity === "hazard").map((f) => f.code).join(",")}`);
    }
  }

  // ---------------------------------------------------------------- write
  const writeJson = (file: string, data: unknown) => fs.writeFileSync(file, JSON.stringify(data));
  for (const sp of ["dog", "cat"] as const) {
    details[sp].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    index[sp].sort((a, b) => (b.sc ?? -1) - (a.sc ?? -1) || a.n.localeCompare(b.n));
    writeJson(path.join(OUT, `products.${sp}.json`), details[sp]);
    writeJson(path.join(PUB, "data", `index.${sp}.json`), index[sp]);
  }
  writeJson(path.join(OUT, "slugs.json"), slugMap);
  const eanMap: Record<string, string> = {};
  for (const p of products) if (p.ean) eanMap[p.ean] = p.slug;
  writeJson(path.join(OUT, "ean.json"), eanMap);
  const brands = (sp: Species) => [...new Set(index[sp].filter((e) => e.c === "complete").map((e) => e.b))].sort((a, b) => a.localeCompare(b));
  const meta: Meta = {
    generatedAt: new Date().toISOString(),
    counts: {
      dog: index.dog.length,
      cat: index.cat.length,
      scoredDog: index.dog.filter((e) => e.sc !== null).length,
      scoredCat: index.cat.filter((e) => e.sc !== null).length,
    },
    brands: { dog: brands("dog"), cat: brands("cat") },
  };
  writeJson(path.join(OUT, "meta.json"), meta);

  const lines = [
    `Scanabowl data build - ${meta.generatedAt}`,
    `Products: ${products.length} (dogs ${meta.counts.dog}, cats ${meta.counts.cat}); scored: ${meta.counts.scoredDog + meta.counts.scoredCat}`,
    `Rows read: ${raw.length}; unusable rows skipped: ${unusable}; images converted this run: ${imagesDone}; blog images: ${blogImages}; products with a photo: ${products.filter((p) => p.image).length}`,
    "",
    `== TOXIC INGREDIENTS FOUND (${problems.hazards.length}) - please double-check the ingredient text`,
    ...problems.hazards.slice(0, 60),
    "",
    `== NO INGREDIENT TEXT (${problems.noIngredients.length}) - fill in \"ingredienten\" so these can be scored`,
    ...problems.noIngredients.slice(0, 100),
    "",
    `== NO ANALYSIS TEXT (${problems.noAnalysis.length}) - scored with reduced confidence; fill in \"analyse\" for a more precise score`,
    ...problems.noAnalysis.slice(0, 100),
    "",
    `== SUSPICIOUS (${problems.suspicious.length}) - ingredient text probably wrong (scraper glitch)`,
    ...problems.suspicious.slice(0, 100),
  ];
  fs.writeFileSync(path.join(DB, "build-report.txt"), lines.join("\n"), "utf8");

  console.log(
    `data: ${products.length} products (${meta.counts.dog} dog / ${meta.counts.cat} cat), ${meta.counts.scoredDog + meta.counts.scoredCat} scored, ${imagesDone} images, ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  console.log(`report: database/build-report.txt  (no ingredients: ${problems.noIngredients.length}, suspicious: ${problems.suspicious.length}, hazards: ${problems.hazards.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
