import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";

// Guard against the mistake that made the site exceed Vercel's free "ISR write" allowance: a huge sitemap
// that changes on every request gets re-stored on every refresh.
describe("sitemap.xml", () => {
  const entries = sitemap();

  it("is deterministic: no timestamps, so an unchanged site never produces a 'new' file", () => {
    expect(JSON.stringify(sitemap())).toBe(JSON.stringify(entries));
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });

  it("stays small: food pages carry no hreflang blocks (the pages declare them themselves)", () => {
    const foods = entries.filter((e) => /\/foods\/.+/.test(new URL(e.url).pathname));
    expect(foods.length).toBeGreaterThan(1000);
    expect(foods.every((e) => !e.alternates)).toBe(true);
    expect(JSON.stringify(entries).length).toBeLessThan(3_000_000);
  });
});
