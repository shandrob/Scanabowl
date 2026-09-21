import "server-only";
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
export async function alternativesFor(p: ProductDetail, count = 14): Promise<IndexEntry[]> {
  if (p.score === null) return [];
  const list = [...(await table(p.species)).values()];
  return list
    .filter(
      (x) =>
        x.id !== p.id &&
        x.category === "complete" &&
        x.score !== null &&
        x.score >= p.score! + 4 &&
        x.confidence !== "low" &&
        x.foodType === p.foodType &&
        (x.lifeStage === p.lifeStage || x.lifeStage === "all" || p.lifeStage === "all"),
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, count)
    .map(detailToIndex);
}
