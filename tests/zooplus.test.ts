import { describe, expect, it } from "vitest";
import { zooplusAffiliateUrl, zooplusSearchQuery } from "../lib/zooplus";

describe("zooplus links", () => {
  it("searches for brand and product line, without pack sizes and shop words", () => {
    expect(zooplusSearchQuery({ brand: "Royal Canin", name: "Royal Canin Kitten - Kattenvoer - 2 kg" })).toBe("Royal Canin Kitten");
    expect(zooplusSearchQuery({ brand: "Felix", name: "Felix Multipack Maaltijdzakjes Junior - Mix 12x100 g" })).toBe("Felix Junior Mix");
    expect(zooplusSearchQuery({ brand: "Applaws", name: "Tuna Fillet in Broth 70 g" })).toBe("Applaws Tuna Fillet in Broth");
  });
  it("goes through the Awin tracker with the Scanabowl publisher id and the zooplus programme", () => {
    const url = new URL(zooplusAffiliateUrl({ brand: "Orijen", name: "Orijen Original Cat" }, "scanabowl-nl-0064992280131"));
    expect(url.hostname).toBe("www.awin1.com");
    expect(url.searchParams.get("awinaffid")).toBe("3106869");
    expect(url.searchParams.get("awinmid")).toBe("8139");
    expect(url.searchParams.get("ued")).toBe("https://www.zooplus.nl/search/results?q=Orijen%20Original%20Cat");
  });
});
