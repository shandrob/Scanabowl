/**
 * Import the zooplus product file from Awin.
 *
 *   npm run data:zooplus              reads database/feeds/*.csv (or .csv.gz), writes database/zooplus/zooplus-feed.csv
 *   npm run data:zooplus -- --images  also downloads photos for foods that have none yet (into database/images)
 *   npm run data:zooplus -- --fetch   downloads the latest feed from AWIN_ZOOPLUS_FEED_URL into database/feeds/ first
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
import { feedItem, isFeedList, parseFeed, type FeedItem } from "../lib/catalog/awin-feed";
import { packGrams } from "../lib/pets/energy";

const ROOT = path.resolve(__dirname, "..");
const FEEDS = path.join(ROOT, "database", "feeds");
const OUT_DIR = path.join(ROOT, "database", "zooplus");
const OUT = path.join(OUT_DIR, "zooplus-feed.csv");
const IMAGES = path.join(ROOT, "database", "images");

export const COLUMNS = ["ean", "naam", "merk", "doeldier", "voertype", "levensfase", "categorie", "ingredienten", "analyse", "verpakking", "prijs", "afbeelding", "bron", "zooplus_url", "opmerking"];

const CROSS_SELL = /\b(bestel ook|probeermix)\b|\+\s*[^\d]*\bgratis\b/i;

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

function loadKnownPackGrams(): Map<string, number | null> {
  const out = new Map<string, number | null>();
  for (const sp of ["dog", "cat"] as const) {
    const f = path.join(ROOT, "data", "generated", `products.${sp}.json`);
    if (!fs.existsSync(f)) continue;
    try {
      const list = JSON.parse(fs.readFileSync(f, "utf8")) as Array<{ ean?: string; pack?: string }>;
      for (const p of list) {
        if (p.ean) out.set(p.ean, packGrams(p.pack ?? ""));
      }
    } catch {
      // ignore if generated files are not built yet
    }
  }
  return out;
}

/** Decide whether candidate `next` is a better match for `ean` than `prev` (handles single packs vs multipack bundles). */
function isBetterVariant(next: FeedItem, prev: FeedItem, targetGrams: number | null | undefined): boolean {
  const nextCross = CROSS_SELL.test(next.name);
  const prevCross = CROSS_SELL.test(prev.name);
  if (nextCross !== prevCross) return !nextCross;

  if (targetGrams && targetGrams > 0) {
    const ng = packGrams(next.pack);
    const pg = packGrams(prev.pack);
    if (ng !== null && pg !== null && ng !== pg) {
      return Math.abs(ng - targetGrams) < Math.abs(pg - targetGrams);
    }
    if (ng === targetGrams && pg !== targetGrams) return true;
    if (pg === targetGrams && ng !== targetGrams) return false;
  }

  const nextLabel = next.ingredients.length + next.analysis.length;
  const prevLabel = prev.ingredients.length + prev.analysis.length;
  if (nextLabel !== prevLabel) return nextLabel > prevLabel;

  // Prefer the single pack over a multi-bag bundle when we do not have a target pack
  const ng = packGrams(next.pack);
  const pg = packGrams(prev.pack);
  if (ng !== null && pg !== null && ng !== pg) return ng < pg;
  return false;
}

async function main() {
  const withImages = process.argv.includes("--images");
  const withFetch = process.argv.includes("--fetch");
  if (!fs.existsSync(FEEDS)) fs.mkdirSync(FEEDS, { recursive: true });

  if (withFetch) {
    const feedUrl = process.env.AWIN_ZOOPLUS_FEED_URL;
    if (!feedUrl) {
      console.log("Set AWIN_ZOOPLUS_FEED_URL in .env.local to use --fetch.");
    } else {
      console.log("Downloading latest zooplus feed from Awin...");
      const res = await fetch(feedUrl);
      if (!res.ok) throw new Error(`Failed to fetch Awin feed: HTTP ${res.status}`);
      const ext = feedUrl.includes(".gz") ? ".csv.gz" : ".csv";
      fs.writeFileSync(path.join(FEEDS, `zooplus-awin${ext}`), Buffer.from(await res.arrayBuffer()));
    }
  }

  const files = fs.readdirSync(FEEDS).filter((f) => /\.(csv|txt)(\.gz)?$/i.test(f)).map((f) => path.join(FEEDS, f));
  if (!files.length) {
    console.log(`No feed found. Put the zooplus file from Awin in ${path.relative(ROOT, FEEDS)}/ (CSV, optionally .gz) and run again.`);
    return;
  }

  const knownPacks = loadKnownPackGrams();
  const items = new Map<string, FeedItem>();
  let rows = 0;
  for (const file of files) {
    const parsed = parseFeed(readFeedFile(file));
    if (isFeedList(parsed)) {
      const zooplus = parsed.filter((r) => /zooplus/i.test(r["advertiser name"] ?? ""));
      console.log(
        `${path.basename(file)} is Awin's list of all shops' product files, not a product file. ` +
          (zooplus.length
            ? `zooplus is in it (status: ${zooplus.map((r) => r["membership status"]).join(", ")}): download the file from the link in its row and put that file here.`
            : "zooplus is not in it yet: zooplus has to accept you in Awin first."),
      );
      continue;
    }
    rows += parsed.length;
    for (const row of parsed) {
      const item = feedItem(row);
      if (!item) continue;
      const prev = items.get(item.ean);
      if (!prev || isBetterVariant(item, prev, knownPacks.get(item.ean))) {
        items.set(item.ean, item);
      }
    }
  }

  if (!items.size) {
    console.log("No dog or cat food found in the files, so nothing was changed.");
    return;
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
      verpakking: i.pack,
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
      await new Promise((r) => setTimeout(r, 150));
    }
    console.log(`photos downloaded: ${done}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

