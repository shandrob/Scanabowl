import "server-only";
import { slugify } from "../catalog/clean";
import type { Grade, Species } from "../scoring/types";
import { detailToIndex } from "./index-entry";
import { allProducts } from "./products";
import type { IndexEntry, ProductDetail } from "./types";

/** A brand gets its own page from this many foods on; smaller brands would make thin pages. */
export const MIN_FOODS_FOR_PAGE = 3;
/** The "highest-scoring brands" ranking only includes brands with at least this many scored foods. */
export const MIN_SCORED_FOR_RANKING = 5;
/** Foods listed per species on a brand page; the finder shows the rest. */
const LIST_PER_SPECIES = 12;
/** Collective names that are not real brands. */
const NOT_A_BRAND = new Set(["overig", "onbekend", ""]);

export interface SpeciesSummary {
  count: number;
  scored: number;
  avg: number | null;
  best: number | null;
  /** scored complete foods per grade */
  grades: Record<Grade, number>;
  /** best-scoring foods first, then the unscored ones */
  top: IndexEntry[];
}

export interface BrandSummary {
  slug: string;
  name: string;
  count: number;
  scored: number;
  avg: number | null;
  best: number | null;
  grades: Record<Grade, number>;
  notScored: number;
  dog: SpeciesSummary | null;
  cat: SpeciesSummary | null;
}

const emptyGrades = (): Record<Grade, number> => ({ A: 0, B: 0, C: 0, D: 0, E: 0 });
const average = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function summarize(list: ProductDetail[]): SpeciesSummary | null {
  if (!list.length) return null;
  const scored = list.filter((p) => p.score !== null);
  const grades = emptyGrades();
  for (const p of scored) if (p.grade) grades[p.grade]++;
  const sorted = [...list].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name));
  return {
    count: list.length,
    scored: scored.length,
    avg: average(scored.map((p) => p.score!)),
    best: scored.length ? Math.max(...scored.map((p) => p.score!)) : null,
    grades,
    top: sorted.slice(0, LIST_PER_SPECIES).map(detailToIndex),
  };
}

let cache: BrandSummary[] | null = null;

/** Every brand with a page, alphabetically. Computed once per server instance from the built food data. */
export async function allBrands(): Promise<BrandSummary[]> {
  if (cache) return cache;
  const bySpecies = await allProducts();
  const groups = new Map<string, { name: string; dog: ProductDetail[]; cat: ProductDetail[] }>();
  for (const species of ["dog", "cat"] as Species[]) {
    for (const p of bySpecies[species]) {
      if (NOT_A_BRAND.has(p.brand.trim().toLowerCase())) continue;
      const slug = slugify(p.brand);
      if (!slug) continue;
      const g = groups.get(slug) ?? { name: p.brand, dog: [], cat: [] };
      g[species].push(p);
      groups.set(slug, g);
    }
  }
  const out: BrandSummary[] = [];
  for (const [slug, g] of groups) {
    const all = [...g.dog, ...g.cat];
    if (all.length < MIN_FOODS_FOR_PAGE) continue;
    const scored = all.filter((p) => p.score !== null);
    const grades = emptyGrades();
    for (const p of scored) if (p.grade) grades[p.grade]++;
    out.push({
      slug,
      name: g.name,
      count: all.length,
      scored: scored.length,
      avg: average(scored.map((p) => p.score!)),
      best: scored.length ? Math.max(...scored.map((p) => p.score!)) : null,
      grades,
      notScored: all.length - scored.length,
      dog: summarize(g.dog),
      cat: summarize(g.cat),
    });
  }
  cache = out.sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }));
  return cache;
}

export async function getBrand(slug: string): Promise<BrandSummary | null> {
  return (await allBrands()).find((b) => b.slug === slug) ?? null;
}

/** Slug of the brand page for a brand name, or null when that brand has no page. */
export async function brandPageSlug(brand: string): Promise<string | null> {
  const slug = slugify(brand);
  return (await allBrands()).some((b) => b.slug === slug) ? slug : null;
}
