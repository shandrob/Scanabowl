/**
 * Import a pet food brand's CSV file into database/brands/<brand>.csv.
 *
 *   npm run data:import-brand -- path/to/brand.csv [--brand="Brand Name"] [--images]
 *   npm run data:build
 *
 * Supports semicolon, comma, or tab delimiters, UTF-8 / Windows-1252 encodings,
 * and either a single "analyse" column or separate nutrient columns
 * (eiwit, vet, celstof, as, vocht, calcium, fosfor, kcal_100g).
 * Existing products on Scanabowl are enriched/upgraded while keeping existing
 * shop links, prices, and photos whenever the brand CSV leaves them blank.
 */
import fs from "node:fs";
import path from "node:path";
import { assembleAnalysis, field, readCsv, writeCsv } from "../lib/catalog/csv";
import { normalizeEan, slugify } from "../lib/catalog/clean";
import { rowToProduct } from "../lib/catalog/records";

const ROOT = path.resolve(__dirname, "..");
const BRANDS_DIR = path.join(ROOT, "database", "brands");
const IMG_DIR = path.join(ROOT, "database", "images");
const EAN_JSON = path.join(ROOT, "data", "generated", "ean.json");

async function downloadImage(ean: string, url: string): Promise<boolean> {
  if (!ean || !/^https?:\/\//i.test(url)) return false;
  fs.mkdirSync(IMG_DIR, { recursive: true });
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    if (fs.existsSync(path.join(IMG_DIR, `${ean}.${ext}`))) return false;
  }
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Scanabowl-Catalog/1.0 (+https://www.scanabowl.com)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return false;
    fs.writeFileSync(path.join(IMG_DIR, `${ean}.${ext}`), buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith("--"));
  const brandArg = args.find((a) => a.startsWith("--brand="))?.slice("--brand=".length).trim();
  const wantImages = !args.includes("--no-images");

  if (!fileArg) {
    console.error("Usage: npm run data:import-brand -- <path-to-file.csv> [--brand=\"Brand Name\"] [--no-images]");
    process.exit(1);
  }

  const inputPath = path.resolve(fileArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const rows = readCsv(inputPath);
  if (rows.length === 0) {
    console.error("No rows found in CSV.");
    process.exit(1);
  }

  const existingEans: Record<string, string> = fs.existsSync(EAN_JSON)
    ? JSON.parse(fs.readFileSync(EAN_JSON, "utf8"))
    : {};

  const outRows: Array<Record<string, string | number | undefined>> = [];
  let updatedCount = 0;
  let newCount = 0;
  let skippedCount = 0;
  let downloadedImages = 0;
  let detectedBrand = brandArg ?? "";

  for (const r of rows) {
    const rowWithBrand = brandArg && !field(r, "brand") ? { ...r, merk: brandArg } : r;
    const p = rowToProduct(rowWithBrand, { knownBrands: detectedBrand ? [detectedBrand] : [], defaultSource: "brand", trustDeclared: true });
    if (!p) {
      skippedCount++;
      continue;
    }
    if (!detectedBrand && p.brand) detectedBrand = p.brand;

    const ean = normalizeEan(field(rowWithBrand, "ean"));
    if (ean && existingEans[ean]) updatedCount++;
    else newCount++;

    const imgUrl = field(rowWithBrand, "image");
    if (wantImages && ean && /^https?:\/\//i.test(imgUrl)) {
      if (await downloadImage(ean, imgUrl)) downloadedImages++;
    }

    outRows.push({
      ean: p.ean,
      naam: p.name,
      merk: p.brand,
      doeldier: p.species === "cat" ? "Kat" : "Hond",
      voertype: p.foodType === "wet" ? "Natvoer" : p.foodType === "frozen" ? "Diepvries" : "Brokken",
      levensfase: p.lifeStage === "young" ? "Puppy/Kitten" : p.lifeStage === "senior" ? "Senior" : "Adult",
      categorie: p.category === "veterinary" ? "Dieetvoer" : p.category === "complementary" ? "Aanvullend" : "Volledig",
      verpakking: p.pack,
      prijs: p.price ?? "",
      ingredienten: p.ingredients,
      analyse: p.analysis || assembleAnalysis(rowWithBrand),
      bol_url: p.bolUrl ?? "",
      afbeelding: imgUrl,
      bron: "brand",
    });
  }

  if (outRows.length === 0) {
    console.error(`No valid dog/cat products found (${skippedCount} rows skipped). Check column headers.`);
    process.exit(1);
  }

  const slug = slugify(detectedBrand || path.basename(inputPath, path.extname(inputPath))) || "brand-import";
  fs.mkdirSync(BRANDS_DIR, { recursive: true });
  const outPath = path.join(BRANDS_DIR, `${slug}.csv`);
  writeCsv(outPath, outRows, [
    "ean",
    "naam",
    "merk",
    "doeldier",
    "voertype",
    "levensfase",
    "categorie",
    "verpakking",
    "prijs",
    "ingredienten",
    "analyse",
    "bol_url",
    "afbeelding",
    "bron",
  ]);

  console.log(
    `Imported ${outRows.length} products (${updatedCount} existing enriched, ${newCount} new, ${skippedCount} skipped)` +
      (downloadedImages ? `, ${downloadedImages} new photos saved` : "") +
      ` -> ${path.relative(ROOT, outPath)}`,
  );
  console.log("Run `npm run data:build` to rebuild the website catalog.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
