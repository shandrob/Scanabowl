import "server-only";
import meta from "@/data/generated/meta.json";
import { GUIDES, getGuideDef, rankGuide, type GuideDef, type GuideResult } from "../guides/defs";
import { allProducts } from "./products";

export interface GuideData extends GuideResult {
  def: GuideDef;
}

/** Year of the data build: guide titles say "best ... 2026" and change with the next deployment, never on a timer. */
export function dataYear(): number {
  return new Date((meta as { generatedAt: string }).generatedAt).getUTCFullYear();
}

export async function getGuide(slug: string): Promise<GuideData | null> {
  const def = getGuideDef(slug);
  if (!def) return null;
  const all = await allProducts();
  return { def, ...rankGuide(def, all[def.species]) };
}

export async function allGuides(): Promise<GuideData[]> {
  const all = await allProducts();
  return GUIDES.map((def) => ({ def, ...rankGuide(def, all[def.species]) }));
}
