import { describe, expect, it } from "vitest";
import type { ProductDetail } from "../lib/data/types";
import { GUIDE_TEXT } from "../lib/guides/content";
import { GUIDES, LARGE_PUPPY_MAX_CALCIUM, PER_BRAND, getGuideDef, rankGuide, recipeKey } from "../lib/guides/defs";

function food(over: Partial<ProductDetail> & { id: string; brand: string; name: string; score: number }): ProductDetail {
  return {
    ean: over.id,
    slug: over.id,
    species: "dog",
    foodType: "dry",
    lifeStage: "adult",
    category: "complete",
    pack: "",
    source: "scraped",
    ingredientsText: "",
    analysisText: "",
    grade: "A",
    confidence: "high",
    pillars: null,
    positives: [],
    negatives: [],
    flags: [],
    animalProteinShare: 0.8,
    animalDmShare: 0.5,
    grainFree: false,
    nutrition: null,
    ingredients: [],
    allergens: { definite: [], possible: [] },
    proteins: ["chicken"],
    ...over,
  } as ProductDetail;
}

describe("best-food guides", () => {
  const dry = getGuideDef("dry-dog-food")!;

  it("treat pack sizes of one recipe as one food", () => {
    expect(recipeKey({ brand: "Applaws", name: "Applaws Dog Adult Large Breed - Kip 15 kg" })).toBe(recipeKey({ brand: "Applaws", name: "Applaws Dog Adult Large Breed - Kip 2 kg" }));
    expect(recipeKey({ brand: "Brit", name: "Brit Premium 12x85 g" })).toBe(recipeKey({ brand: "Brit", name: "Brit Premium 6x85 g" }));
  });

  it("rank by score, one pack size per recipe, at most PER_BRAND foods per brand", () => {
    const foods = [
      food({ id: "1", brand: "A", name: "A Adult Kip 2 kg", score: 95 }),
      food({ id: "2", brand: "A", name: "A Adult Kip 12 kg", score: 95 }),
      food({ id: "3", brand: "A", name: "A Adult Lam", score: 94 }),
      food({ id: "4", brand: "A", name: "A Adult Vis", score: 93 }),
      food({ id: "5", brand: "B", name: "B Adult", score: 90 }),
      food({ id: "6", brand: "C", name: "C Adult", score: 99, category: "veterinary" }),
      food({ id: "7", brand: "D", name: "D Adult", score: 98, confidence: "low" }),
      food({ id: "8", brand: "E", name: "E Puppy", score: 97, lifeStage: "young" }),
    ];
    const r = rankGuide(dry, foods);
    // "1" and "2" are the same recipe: exactly one of them is listed
    expect(["1", "2"]).toContain(r.top[0].id);
    expect(r.top.slice(1).map((p) => p.id)).toEqual(["3", "5"]);
    expect(r.top.filter((p) => p.brand === "A").length).toBe(PER_BRAND);
  });

  it("keep large-breed puppy foods above the FEDIAF calcium maximum out of their list", () => {
    const def = getGuideDef("large-breed-puppy-food")!;
    const nutrition = (calcium?: number) => ({ dm: { protein: 30, fat: 15, fibre: 3, ash: 7, nfe: 40, calcium } }) as unknown as ProductDetail["nutrition"];
    const foods = [
      food({ id: "hi", brand: "X", name: "X Puppy Large Breed", score: 96, lifeStage: "young", nutrition: nutrition(LARGE_PUPPY_MAX_CALCIUM + 0.3) }),
      food({ id: "ok", brand: "Y", name: "Y Puppy Maxi", score: 90, lifeStage: "young", nutrition: nutrition(1.2) }),
      food({ id: "small", brand: "Z", name: "Z Puppy Small", score: 99, lifeStage: "young", nutrition: nutrition(1.2) }),
    ];
    expect(rankGuide(def, foods).top.map((p) => p.id)).toEqual(["ok"]);
  });

  it("have every text in every language, with only known placeholders", () => {
    for (const lang of ["nl", "en", "de", "fr"] as const) {
      for (const g of GUIDES) {
        const text = GUIDE_TEXT[lang][g.slug];
        expect(text, `${lang} ${g.slug}`).toBeDefined();
        expect(text.tips.length, `${lang} ${g.slug} tips`).toBe(GUIDE_TEXT.nl[g.slug].tips.length);
        const all = [text.h1, text.title, text.description, text.card, text.intro, ...text.tips].join(" ");
        const unknown = [...all.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => !["year", "count", "lang"].includes(k));
        expect(unknown, `${lang} ${g.slug}`).toEqual([]);
      }
    }
  });

  it("have unique slugs", () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });
});

describe("best-food guides on the real data", async () => {
  const { allGuides } = await import("../lib/data/guides");
  const guides = await allGuides();
  it("all have a full top list", () => {
    for (const g of guides) expect(g.top.length, g.def.slug).toBeGreaterThanOrEqual(5);
  });
  it("never list a food twice or a food that is not a complete, scored food", () => {
    for (const g of guides) {
      expect(new Set(g.top.map((p) => p.id)).size).toBe(g.top.length);
      for (const p of g.top) {
        expect(p.category).toBe("complete");
        expect(p.score).not.toBeNull();
        expect(p.species).toBe(g.def.species);
      }
    }
  });
});
