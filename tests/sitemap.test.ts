import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";

// Guard against the mistake that made the site exceed Vercel's free "ISR write" allowance: a huge sitemap
// that changes on every request gets re-stored on every refresh.
describe("sitemap.xml", async () => {
  const entries = await sitemap();

  it("is deterministic: no timestamps, so an unchanged site never produces a 'new' file", async () => {
    expect(JSON.stringify(await sitemap())).toBe(JSON.stringify(entries));
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });

  it("stays small: food pages carry no hreflang blocks (the pages declare them themselves)", () => {
    const foods = entries.filter((e) => /\/foods\/(?!(brand|without)(\/|$)).+/.test(new URL(e.url).pathname));
    expect(foods.length).toBeGreaterThan(1000);
    expect(foods.every((e) => !e.alternates)).toBe(true);
    expect(JSON.stringify(entries).length).toBeLessThan(3_000_000);
  });
});

describe("brand pages", async () => {
  const { allBrands, MIN_FOODS_FOR_PAGE } = await import("../lib/data/brands");
  const brands = await allBrands();
  it("exist for real brands with enough foods, never for the 'other' bucket", () => {
    expect(brands.length).toBeGreaterThan(50);
    expect(brands.every((b) => b.count >= MIN_FOODS_FOR_PAGE)).toBe(true);
    expect(brands.some((b) => b.slug === "overig")).toBe(false);
    expect(new Set(brands.map((b) => b.slug)).size).toBe(brands.length);
  });
  it("have consistent statistics", () => {
    for (const b of brands) {
      expect(b.scored + b.notScored).toBe(b.count);
      const graded = Object.values(b.grades).reduce((x, y) => x + y, 0);
      expect(graded).toBe(b.scored);
      if (b.avg !== null) expect(b.avg).toBeLessThanOrEqual(b.best ?? 0);
    }
  });
  it("split BIOFOOD from BF Petfood and resolve valid shared-producer sister links", async () => {
    const { getBrandStory } = await import("../lib/data/brand-stories");
    const bySlug = new Map(brands.map((b) => [b.slug, b]));
    expect(bySlug.get("bf-petfood")?.count).toBe(120);
    expect(bySlug.get("biofood")?.count).toBe(13);
    for (const b of brands) {
      const story = getBrandStory(b, "en");
      if (!story.sharedProducer) continue;
      expect(story.sharedProducer.sisterSlugs).not.toContain(b.slug);
      for (const sister of story.sharedProducer.sisterSlugs) {
        expect(bySlug.has(sister), `${b.slug} -> missing sister ${sister}`).toBe(true);
      }
    }
    expect(getBrandStory(bySlug.get("biofood")!, "nl").sharedProducer?.sisterSlugs).toEqual(["bf-petfood"]);
    expect(getBrandStory(bySlug.get("bf-petfood")!, "nl").sharedProducer?.sisterSlugs).toEqual(["biofood"]);
  });
});
