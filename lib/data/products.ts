import "server-only";
import { packGrams } from "../pets/energy";
import type { Species } from "../scoring/types";
import type { IndexEntry, ProductDetail } from "./types";
import { detailToIndex } from "./index-entry";
import slugMap from "@/data/generated/slugs.json";

const loaders: Record<Species, () => Promise<ProductDetail[]>> = {
  dog: () => import("@/data/generated/products.dog.json").then((m) => m.default as unknown as ProductDetail[]),
  cat: () => import("@/data/generated/products.cat.json").then((m) => m.default as unknown as ProductDetail[]),
};

const bySlug = new Map<Species, Map<string, ProductDetail>>();

async function table(species: Species): Promise<Map<string, ProductDetail>> {
  let t = bySlug.get(species);
  if (!t) {
    const list = await loaders[species]();
    t = new Map(list.map((p) => [p.slug, p]));
    bySlug.set(species, t);
  }
  return t;
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const species = (slugMap as Record<string, Species>)[slug];
  if (!species) return null;
  return (await table(species)).get(slug) ?? null;
}

export async function allProducts(): Promise<Record<Species, ProductDetail[]>> {
  const [dog, cat] = await Promise.all([table("dog"), table("cat")]);
  return { dog: [...dog.values()], cat: [...cat.values()] };
}

export function allProductSlugs(): string[] {
  return Object.keys(slugMap);
}

export async function topProducts(species: Species, count: number): Promise<ProductDetail[]> {
  const list = [...(await table(species)).values()];
  return list
    .filter((p) => p.category === "complete" && p.score !== null && p.confidence !== "low" && p.image)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, count);
}

/**
 * Rank of a food among foods of its own kind (same species, same type: dry with dry, wet with wet).
 * Equal scores share a rank.
 */
export async function typeRank(p: ProductDetail): Promise<{ rank: number; total: number } | null> {
  if (p.score === null || p.category !== "complete") return null;
  let higher = 0;
  let total = 0;
  for (const x of (await table(p.species)).values()) {
    if (x.category !== "complete" || x.score === null || x.foodType !== p.foodType) continue;
    total++;
    if (x.score > p.score) higher++;
  }
  return total >= 10 ? { rank: higher + 1, total } : null;
}

export type BenchKey = "protein" | "fat" | "carbs";
export interface Benchmark {
  /** share of foods of the same kind with a lower value, 0-100 */
  below: number;
  median: number;
  /** 10th and 90th percentile: the usual range for this kind of food */
  p10: number;
  p90: number;
}

const benchCache = new Map<string, Record<BenchKey, number[]>>();

/**
 * How this food's protein, fat (both % of dry matter) and carbohydrates (% of energy) compare with complete foods of
 * the same species and type - "more protein than 80% of dry cat foods".
 */
export async function benchmarks(p: ProductDetail): Promise<{ count: number; values: Record<BenchKey, Benchmark> } | null> {
  if (!p.nutrition || p.category !== "complete") return null;
  const key = `${p.species}|${p.foodType}`;
  let sorted = benchCache.get(key);
  if (!sorted) {
    const peers = [...(await table(p.species)).values()].filter((x) => x.category === "complete" && x.foodType === p.foodType && x.nutrition);
    const col = (f: (x: ProductDetail) => number) => peers.map(f).sort((a, b) => a - b);
    sorted = { protein: col((x) => x.nutrition!.dm.protein), fat: col((x) => x.nutrition!.dm.fat), carbs: col((x) => x.nutrition!.energyShare.carbs) };
    benchCache.set(key, sorted);
  }
  const n = sorted.protein.length;
  if (n < 20) return null;
  const at = (arr: number[], f: number) => arr[Math.min(arr.length - 1, Math.floor(f * (arr.length - 1)))];
  const bench = (arr: number[], v: number): Benchmark => ({
    below: Math.round((arr.filter((x) => x < v).length / arr.length) * 100),
    median: Math.round(at(arr, 0.5) * 10) / 10,
    p10: Math.round(at(arr, 0.1) * 10) / 10,
    p90: Math.round(at(arr, 0.9) * 10) / 10,
  });
  const nu = p.nutrition;
  return {
    count: n,
    values: { protein: bench(sorted.protein, nu.dm.protein), fat: bench(sorted.fat, nu.dm.fat), carbs: bench(sorted.carbs, nu.energyShare.carbs) },
  };
}

export async function productCounts(): Promise<{ products: number; brands: number }> {
  const [dog, cat] = await Promise.all([table("dog"), table("cat")]);
  const brands = new Set<string>();
  for (const t of [dog, cat]) for (const p of t.values()) if (p.category === "complete") brands.add(p.brand);
  return { products: dog.size + cat.size, brands: brands.size };
}

/**
 * Higher-scoring foods of the same kind. The browser filters this candidate list again for the
 * visitor's pet (allergies), so we hand over a generous number.
 */
export async function alternativesFor(p: ProductDetail, count = 20): Promise<IndexEntry[]> {
  if (p.score === null) return [];
  const list = [...(await table(p.species)).values()];
  const compatible = list.filter(
    (x) =>
      x.id !== p.id &&
      x.category === "complete" &&
      x.score !== null &&
      x.confidence !== "low" &&
      x.foodType === p.foodType &&
      (x.lifeStage === p.lifeStage || x.lifeStage === "all" || p.lifeStage === "all"),
  );

  const ppkOf = (x: ProductDetail): number | null => {
    if (!x.price || x.price <= 0 || !x.pack) return null;
    const g = packGrams(x.pack);
    return g && g > 0 ? x.price / (g / 1000) : null;
  };

  const strictlyHigher = compatible
    .filter((x) => x.score! > p.score!)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const topPeers =
    strictlyHigher.length < 6
      ? compatible
          .filter((x) => x.score! >= 85 && x.brand !== p.brand)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      : [];

  const higher: ProductDetail[] = [];
  const brandCountHigher = new Map<string, number>();
  for (const x of [...strictlyHigher, ...topPeers]) {
    if (higher.some((h) => h.id === x.id)) continue;
    const bc = brandCountHigher.get(x.brand) ?? 0;
    if (bc >= 2) continue;
    brandCountHigher.set(x.brand, bc + 1);
    higher.push(x);
    if (higher.length >= count) break;
  }

  const cheaperCandidates = compatible
    .map((x) => ({ x, ppk: ppkOf(x) }))
    .filter((r): r is { x: ProductDetail; ppk: number } => r.ppk !== null && (r.x.score ?? 0) >= 75)
    .sort((a, b) => a.ppk - b.ppk || (b.x.score ?? 0) - (a.x.score ?? 0));

  const cheaperHigh: ProductDetail[] = [];
  const brandCountValue = new Map<string, number>();
  for (const { x } of cheaperCandidates) {
    const bc = brandCountValue.get(x.brand) ?? 0;
    if (bc >= 2) continue;
    brandCountValue.set(x.brand, bc + 1);
    cheaperHigh.push(x);
    if (cheaperHigh.length >= 12) break;
  }

  const seen = new Set<string>();
  const merged: ProductDetail[] = [];
  for (const item of [...higher, ...cheaperHigh]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.map(detailToIndex);
}
