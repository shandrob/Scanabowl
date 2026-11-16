import { describe, expect, it } from "vitest";
import { shopLinks } from "../lib/shops";
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
  it("builds localized multi-shop comparison links across nl, de, and fr", () => {
    const nl = shopLinks({ ean: "0064992280131", name: "Orijen Original Cat", brand: "Orijen" }, "nl", "test-nl");
    expect(nl.map((s) => s.id)).toEqual(["zooplus", "brekz", "bol", "amazon"]);
    expect(nl.find((s) => s.id === "brekz")?.url).toContain("https://www.brekz.nl/search");
    expect(nl.find((s) => s.id === "amazon")?.url).toContain("https://www.amazon.nl/s");

    const de = shopLinks({ ean: "0064992280131", name: "Orijen Original Cat", brand: "Orijen" }, "de", "test-de");
    expect(de.map((s) => s.id)).toEqual(["zooplus", "brekz", "amazon"]);
    expect(de.find((s) => s.id === "zooplus")?.url).toContain("https://www.zooplus.de/");
    expect(de.find((s) => s.id === "brekz")?.url).toContain("https://www.brekz.de/search");
  });
});
