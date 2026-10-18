import "server-only";
import { allBrands, type BrandSummary } from "./brands";

export const HERO_EXAMPLES = [
  {
    key: "exampleLow" as const,
    slug: "bonzo-maxi-brokken-15-kg-7613287220585",
  },
  {
    key: "exampleMid" as const,
    slug: "royal-canin-sterilised-medium-12-kg-3182550928724",
  },
  {
    key: "exampleHigh" as const,
    slug: "applaws-dog-adult-large-breed-kip-15-kg-5060333439323",
  },
] as const;

export interface PopularFoodLink {
  slug: string;
  label: string;
  species: "dog" | "cat";
  score: number;
}

export const POPULAR_FOODS: PopularFoodLink[] = [
  {
    slug: "royal-canin-sterilised-37-3182550737555",
    label: "Royal Canin Sterilised 37",
    species: "cat",
    score: 43,
  },
  {
    slug: "purina-one-sterilcat-kip-tarwe-7-5-kg-8445291097346",
    label: "Purina One Sterilcat Kip & Tarwe",
    species: "cat",
    score: 66,
  },
  {
    slug: "edgard-en-cooper-edgard-en-cooper-blik-chicken-turkey-adult-kip-kalkoen-aardbei-400-g-graa-5425039485300",
    label: "Edgard & Cooper Adult Kip & Kalkoen",
    species: "dog",
    score: 92,
  },
  {
    slug: "royal-canin-sterilised-medium-12-kg-3182550928724",
    label: "Royal Canin Sterilised Medium",
    species: "dog",
    score: 66,
  },
  {
    slug: "royal-canin-labrador-retriever-sterilised-adult-3182550787581",
    label: "Royal Canin Labrador Retriever Adult",
    species: "dog",
    score: 72,
  },
  {
    slug: "hill-s-canine-adult-light-small-en-mini-breed-kip-0052742024745",
    label: "Hill's Adult Small & Mini Kip",
    species: "dog",
    score: 71,
  },
  {
    slug: "orijen-whole-prey-original-dog-kip-en-kalkoen-0064992182120",
    label: "Orijen Whole Prey Original Dog",
    species: "dog",
    score: 97,
  },
  {
    slug: "acana-regionals-wild-prairie-dog-kip-en-vis-en-ei-0064992540357",
    label: "Acana Wild Prairie Dog",
    species: "dog",
    score: 93,
  },
  {
    slug: "carnilove-active-dog-adult-lam-en-wild-zwijn-8595602581108",
    label: "Carnilove Adult Lam & Wild Zwijn",
    species: "dog",
    score: 96,
  },
  {
    slug: "prins-procare-exellent-sport-life-kip-en-kalkoen-8713595035464",
    label: "Prins ProCare Excellent",
    species: "dog",
    score: 83,
  },
  {
    slug: "applaws-cat-adult-kip-2-kg-5060122491426",
    label: "Applaws Cat Adult Kip",
    species: "cat",
    score: 93,
  },
  {
    slug: "applaws-dog-adult-large-breed-kip-15-kg-5060333439323",
    label: "Applaws Dog Adult Large Breed Kip",
    species: "dog",
    score: 94,
  },
  {
    slug: "whiskas-1-vis-selectie-in-gelei-maaltijdzakjes-multipack-12x100-g-9003579011041",
    label: "Whiskas 1+ Vis Selectie in Gelei",
    species: "cat",
    score: 85,
  },
  {
    slug: "felix-multipack-sensations-vis-in-saus-zalm-en-koolvis-en-forel-12x85-g-7613039851111",
    label: "Felix Sensations Vis in Saus",
    species: "cat",
    score: 47,
  },
  {
    slug: "bonzo-maxi-brokken-15-kg-7613287220585",
    label: "Bonzo Maxi Brokken",
    species: "dog",
    score: 37,
  },
];

const CURATED_BRAND_SLUGS = [
  "royal-canin",
  "purina-one",
  "edgard-en-cooper",
  "hill-s",
  "orijen",
  "acana",
  "carnilove",
  "applaws",
  "prins",
  "renske",
  "whiskas",
  "felix",
  "gourmet",
  "rocco",
  "wolf-of-wilderness",
  "concept-for-life",
  "carocroc",
  "biofood",
  "smolke",
  "pedigree",
];

export async function popularBrands(limit = 18): Promise<BrandSummary[]> {
  const brands = await allBrands();
  const bySlug = new Map(brands.map((b) => [b.slug, b]));
  const picked: BrandSummary[] = [];
  for (const s of CURATED_BRAND_SLUGS) {
    const b = bySlug.get(s);
    if (b) picked.push(b);
  }
  if (picked.length < limit) {
    const seen = new Set(picked.map((b) => b.slug));
    const byCount = [...brands].sort((a, b) => b.count - a.count);
    for (const b of byCount) {
      if (picked.length >= limit) break;
      if (!seen.has(b.slug)) picked.push(b);
    }
  }
  return picked.slice(0, limit);
}
