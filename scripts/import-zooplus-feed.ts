/**
 * Import the zooplus product file from Awin.
 *
 *   npm run data:zooplus              reads database/feeds/*.csv (or .csv.gz), writes database/zooplus/zooplus-feed.csv
 *   npm run data:zooplus -- --images  also downloads photos for foods that have none yet (into database/images)
 *
 * The output is small (dog and cat food only, a handful of columns) and is what the website build reads:
 *  - every food with a barcode we already know gets an exact "view at zooplus" link and, if missing, a price;
 *  - foods we do not know yet are added when zooplus shows their ingredient list (otherwise they could not
 *    be scored); the rest are counted in database/build-report.txt.
 * The raw feed itself stays out of git (database/feeds/ is ignored): it is large and changes daily.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { writeCsv } from "../lib/catalog/csv";
import { feedItem, parseFeed, type FeedItem } from "../lib/catalog/awin-feed";

const ROOT = path.resolve(__dirname, "..");
const FEEDS = path.join(ROOT, "database", "feeds");
const OUT_DIR = path.join(ROOT, "database", "zooplus");
const OUT = path.join(OUT_DIR, "zooplus-feed.csv");
const IMAGES = path.join(ROOT, "database", "images");

export const COLUMNS = ["ean", "naam", "merk", "doeldier", "voertype", "levensfase", "categorie", "ingredienten", "analyse", "verpakking", "prijs", "afbeelding", "bron", "zooplus_url", "opmerking"];

function readFeedFile(file: string): string {
  const buf = fs.readFileSync(file);
  return (file.endsWith(".gz") ? zlib.gunzipSync(buf) : buf).toString("utf8");
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Scanabowl image import (+https://www.scanabowl.com)" } });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return false;
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const withImages = process.argv.includes("--images");
  if (!fs.existsSync(FEEDS)) fs.mkdirSync(FEEDS, { recursive: true });
  const files = fs.readdirSync(FEEDS).filter((f) => /\.(csv|txt)(\.gz)?$/i.test(f)).map((f) => path.join(FEEDS, f));
  if (!files.length) {
    console.log(`No feed found. Put the zooplus file from Awin in ${path.relative(ROOT, FEEDS)}/ (CSV, optionally .gz) and run again.`);
    return;
  }

  const items = new Map<string, FeedItem>();
  let rows = 0;
  for (const file of files) {
    const parsed = parseFeed(readFeedFile(file));
    rows += parsed.length;
    for (const row of parsed) {
      const item = feedItem(row);
      if (!item) continue;
      const prev = items.get(item.ean);
      // the same barcode can appear in several variants: keep the one with the most label text
      if (!prev || item.ingredients.length + item.analysis.length > prev.ingredients.length + prev.analysis.length) items.set(item.ean, item);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const list = [...items.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
  writeCsv(
    OUT,
    list.map((i) => ({
      ean: i.ean,
      naam: i.name,
      merk: i.brand,
      doeldier: i.species,
      // last step of the shop category, e.g. "Kat > Kattenvoer > Natvoer" -> "Natvoer"
      voertype: i.category.split(/\s*[>|/]\s*/).pop() ?? "",
      levensfase: "",
      categorie: "",
      ingredienten: i.ingredients,
      analyse: i.analysis,
      verpakking: "",
      prijs: i.price,
      afbeelding: i.image,
      bron: "scraped",
      zooplus_url: i.url,
      opmerking: "zooplus-feed",
    })),
    COLUMNS,
  );
  const withLabel = list.filter((i) => i.ingredients).length;
  console.log(`zooplus feed: ${rows} rows read, ${list.length} dog/cat foods with a barcode (${withLabel} with an ingredient list) -> ${path.relative(ROOT, OUT)}`);

  if (withImages) {
    fs.mkdirSync(IMAGES, { recursive: true });
    const have = new Set(fs.readdirSync(IMAGES).map((f) => f.replace(/\.[a-z]+$/i, "")));
    // only foods that will be on the site: already known, or new with an ingredient list
    const eanFile = path.join(ROOT, "data", "generated", "ean.json");
    const known = new Set(fs.existsSync(eanFile) ? Object.keys(JSON.parse(fs.readFileSync(eanFile, "utf8")) as Record<string, string>) : []);
    let done = 0;
    for (const i of list) {
      if (!i.image || have.has(i.ean) || !(known.has(i.ean) || i.ingredients)) continue;
      const ext = /\.png(\?|$)/i.test(i.image) ? "png" : "jpg";
      if (await download(i.image, path.join(IMAGES, `${i.ean}.${ext}`))) done++;
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`photos downloaded: ${done}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
